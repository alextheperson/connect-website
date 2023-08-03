import { Namespace } from 'socket.io';

export type GameSetting = {
  width: number;
  height: number;
  numberToConnect: number;
  diagonals: boolean;
  gravity: boolean;
  numPlayers: number;
  fractalized: boolean;
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
    return this.settings['turnPattern'][this.currentTurn].player;
  }

  get currentPiece() {
    return this.settings['turnPattern'][this.currentTurn].piece;
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
    this.board = new Array(this.settings.height)
      .fill(-1)
      .map((u) => new Array(this.settings.width).fill(-1));
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
      this.board[y][x] == -1
    ) {
      //If it is their turn
      this.board[y][x] = this.currentTurn;
      this.currentTurn += 1;
      if (this.currentTurn >= this.settings['turnPattern'].length) {
        this.currentTurn = 0;
      }
    } else {
      return 'invalid-move';
    }
    return this.evaluateBoard();
  }

  evaluateBoard() {
    let hasDrawn = true;
    for (let y = 0; y < this.board.length; y++) {
      for (let x = 0; x < this.board[0].length; x++) {
        //v h d1 d2
        if (this.board[y][x] > -1) {
          let hasWonHorizontal = true;
          let hasWonVertical = true;
          let hasWonDiagonal1 = true;
          let hasWonDiagonal2 = true;
          for (let i = 0; i < this.settings['numberToConnect']; i++) {
            if (this.board[y][x + i] != this.board[y][x]) {
              hasWonHorizontal = false;
            }
            if (
              this.board[y + i] === undefined ||
              this.board[y + i][x] != this.board[y][x]
            ) {
              hasWonVertical = false;
            }
            if (
              this.board[y + i] === undefined ||
              this.board[y + i][x + i] != this.board[y][x]
            ) {
              hasWonDiagonal1 = false;
            }
            if (
              this.board[y + i] === undefined ||
              this.board[y + i][x - 1] != this.board[y][x]
            ) {
              hasWonDiagonal2 = false;
            }
          }
          if (
            hasWonHorizontal ||
            hasWonVertical ||
            hasWonDiagonal1 ||
            hasWonDiagonal2
          ) {
            return {
              outcome: turnResults.WIN,
              player: this.settings['turnPattern'][this.board[y][x]]['player'],
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
    return {
      outcome: hasDrawn ? turnResults.DRAW : turnResults.NORMAL,
    };
  }
}
