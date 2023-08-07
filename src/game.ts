import { Namespace } from 'socket.io';
export type rulesets = 'fractal' | 'gravity-rotate' | 'none';
export type vector = {
  x: 0 | 1 | -1;
  y: 0 | 1 | -1;
};
export type GameSetting = {
  boardWidth: number;
  boardHeight: number;
  numToConnect: number;
  allowDiagonals: boolean;
  hasGravity: boolean;
  gravityDirection: vector;
  numPlayers: number;
  allowSpectators: boolean;
  extraRulesets: rulesets;
  pieces: boolean[];
  turnPattern: {
    player: number;
    piece: number;
  }[];
};

export enum turnResults {
  'NORMAL',
  'WIN',
  'DRAW',
}

export class Game {
  id: string;
  settings: GameSetting;
  board: number[][];
  currentTurn: number;
  // currentPlayer: number;
  // currentPiece: number;
  players: string[] = [];
  gameFinished: boolean = false;

  constructor(id: string, settings: GameSetting) {
    this.id = id;
    this.settings = settings;
  }

  get numPlayers() {
    return this.players.length;
  }

  get gameState() {
    return {
      board: this.board,
      currentTurn: this.currentTurn,
    };
  }

  get currentPlayer() {
    return this.settings.turnPattern[this.currentTurn].player;
  }

  get currentPiece() {
    return this.settings.turnPattern[this.currentTurn].piece;
  }

  hasPlayer(id: string) {
    return this.players.includes(id);
  }

  addPlayer(id: string, namespace: Namespace) {
    if (
      this.numPlayers < this.settings.numPlayers &&
      !this.players.includes(id)
    ) {
      this.players.push(id);
      if (this.numPlayers === this.settings.numPlayers) {
        this.initializeGame(namespace);
      }
      return true;
    }
    return false;
  }

  removePlayer(id: string) {
    if (this.players.includes(id)) {
      this.players.splice(this.players.indexOf(id), 1);
    }
  }

  initializeGame(namespace: Namespace) {
    this.board = new Array(this.settings.boardHeight)
      .fill(-1)
      .map((u) => new Array(this.settings.boardWidth).fill(-1));
    this.currentTurn = 0;
    for (let i = 0; i < this.players.length; i++) {
      namespace
        .to(this.players[i])
        .emit('start-game', { 'own-number': i, settings: this.settings });
    }
    namespace.emit('game-state', this.gameState);
  }

  placeToken(id: string, x: number, y: number) {
    if (
      this.currentTurn !== undefined &&
      this.players.indexOf(id) == this.currentPlayer &&
      this.board[y][x] == -1 &&
      !this.gameFinished
    ) {
      //If it is their turn
      this.board[y][x] = this.currentTurn;
      this.currentTurn += 1;
      if (this.currentTurn >= this.settings.turnPattern.length) {
        this.currentTurn = 0;
      }
    } else {
      return 'invalid-move';
    }
    this.applyGravityToBoard();
    return this.evaluateBoard();
  }

  checkForMatch(x1: number, y1: number, x2: number, y2: number) {
    if (this.board[y1] === undefined || this.board[y2] === undefined) {
      // check if it has gone off the the board vertically.
      return false;
    }
    if (
      this.board[y1][x1] === undefined ||
      this.board[y1][x1] === -1 ||
      this.board[y2][x2] === undefined ||
      this.board[y2][x2] === -1
    ) {
      // check if it has gone off the the board horizontally or if it is an empty space.
      return false;
    }
    if (!this.settings.pieces[this.board[y1][x1]]) {
      return false;
    }
    if (
      this.settings.turnPattern[this.board[y1][x1]].piece !==
        this.settings.turnPattern[this.board[y2][x2]].piece &&
      this.settings.turnPattern[this.board[y1][x1]].player !==
        this.settings.turnPattern[this.board[y2][x2]].player
    ) {
      // check if they are the same player
      return false;
    }
    return true;
  }

  evaluateBoard() {
    let hasDrawn = true;
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[0].length; x++) {
        //v h d1 d2
        if (this.board[y][x] > -1) {
          let hasWonHorizontal = true;
          let hasWonVertical = true;
          let hasWonDiagonal1 = this.settings.allowDiagonals;
          let hasWonDiagonal2 = this.settings.allowDiagonals;
          for (let i = 1; i < this.settings.numToConnect; i++) {
            if (!this.checkForMatch(x, y, x + i, y)) {
              hasWonHorizontal = false;
            }
            if (!this.checkForMatch(x, y, x, y + i)) {
              hasWonVertical = false;
            }
            if (!this.checkForMatch(x, y, x + i, y + i)) {
              hasWonDiagonal1 = false;
            }
            if (!this.checkForMatch(x, y, x - i, y + i)) {
              hasWonDiagonal2 = false;
            }
          }
          if (
            hasWonHorizontal ||
            hasWonVertical ||
            hasWonDiagonal1 ||
            hasWonDiagonal2
          ) {
            this.gameFinished = true;
            return {
              outcome: turnResults.WIN,
              player: this.settings.turnPattern[this.board[y][x]].player,
              position: {
                x: x,
                y: y,
              },
              direction: hasWonHorizontal
                ? 'h'
                : hasWonVertical
                ? 'v'
                : hasWonDiagonal1
                ? 'd1'
                : 'd2',
            };
          }
        } else {
          hasDrawn = false;
        }
      }
    }
    this.gameFinished = hasDrawn;
    return {
      outcome: hasDrawn ? turnResults.DRAW : turnResults.NORMAL,
    };
  }

  computeGravity(x, y, direction) {
    let localX = x;
    if (direction.x === 1) {
      localX = 0;
    } else if (direction.x === -1) {
      localX = this.settings.boardWidth - 1;
    }
    let localY = y;
    if (direction.y === 1) {
      localY = 0;
    } else if (direction.y === -1) {
      localY = this.settings.boardHeight - 1;
    }

    if (direction.x !== 0 && direction.y !== 0) {
      let delta = Math.min(Math.abs(x - localX), Math.abs(y - localY));
      localX = x + delta * -direction.x;
      localY = y + delta * -direction.y;
    }
    if (this.board[localY][localX] === -1) {
      for (
        let i = 0;
        i <
        Math.ceil((this.board.length ** 2 + this.board[1].length ** 2) ** 0.5); // Length of the diagonal
        i++
      ) {
        if (
          this.board[(i + 1) * direction.y + localY] === undefined ||
          this.board[(i + 1) * direction.y + localY][
            (i + 1) * direction.x + localX
          ] === undefined ||
          this.board[(i + 1) * direction.y + localY][
            (i + 1) * direction.x + localX
          ] > -1
        ) {
          return {
            x: i * direction.x + localX,
            y: i * direction.y + localY,
          };
        }
      }
    }
    return null;
  }

  applyGravityToBoard() {
    let down = {
      x: 1,
      y: 0,
    };
    let up = {
      x: -down.x,
      y: -down.y,
    };
    let left = {
      x: down.y,
      y: down.x,
    };
    let right = {
      x: -down.y,
      y: -down.x,
    };

    let currentToken = {
      x: 0,
      y: 0,
    };

    // let diagonalLength = Math.ceil(
    //   gameBoard.length ^ (2 + gameBoard[1].length) ^ 2 ^ 0.5
    // );
    // let isDiagonal = down.x !== 0 && down.y !== 0;

    // let boardArea = isDiagonal ? diagonalLength**2 : gam

    // for (let i = 0; i < (boardArea); i++) {

    // }
  }
}
