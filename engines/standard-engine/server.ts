import { GameSetting, TurnPattern, TurnResults, Vector } from '../../src/game';
import { Board, GameEngine, Piece, Player, Turn } from '../../src/game-engine';

export class StandardEngine implements GameEngine {
  board: Board;

  turns: Turn[] = [];

  numToConnect: number;
  allowDiagonals: boolean;
  doGravity: boolean;
  gravityAngle: Vector;

  currentTurnNumber: number;

  settings: GameSetting;

  constructor(settings: GameSetting) {
    this.settings = settings;
    (settings.turnPattern as TurnPattern).forEach((el, i) => {
      this.turns[i] = new Turn(
        i,
        new Piece(el.piece, settings.pieces[el.piece]),
        new Player(el.player)
      );
    });

    this.numToConnect = settings.numToConnect as number;
    this.allowDiagonals = settings.allowDiagonals as boolean;
    this.doGravity = settings.doGravity as boolean;
    this.gravityAngle = settings.gravityAngle as Vector;

    this.currentTurnNumber = 0;

    this.board = new Board(
      settings.boardWidth as number,
      settings.boardHeight as number
    );
  }

  get currentTurn(): Turn {
    return this.turns[this.currentTurnNumber];
  }

  get currentPlayer() {
    return this.currentTurn.player;
  }

  get currentPiece() {
    return this.currentTurn.piece;
  }

  getTurn(playerIndex, pieceIndex): Turn | null {
    this.turns.map((el) => {
      if (el.player.index === playerIndex && el.piece.index === pieceIndex) {
        return el;
      }
    });
    return null;
  }

  sendGameState(): object {
    return {
      board: this.board.packed(),
      currentTurn: this.currentTurnNumber,
    };
  }

  placeToken(x: number, y: number, turn: Turn): boolean {
    if (this.validateMove(x, y, turn)) {
      this.board.setSpace(x, y, turn);
      this.currentTurnNumber += 1;
      if (this.currentTurnNumber >= this.turns.length) {
        this.currentTurnNumber = 0;
      }
      return true;
    } else {
      return false;
    }
  }

  validateMove(x: number, y: number, turn: Turn): boolean {
    let gravityPosition = this.computeGravity(x, y, this.gravityAngle);
    return (
      turn.index == this.currentTurnNumber &&
      (this.board.isEmpty(x, y) ?? false) &&
      (!this.doGravity ||
        (gravityPosition !== null &&
          gravityPosition.x === x &&
          gravityPosition.y === y))
    );
  }

  checkForConnect(x1: number, y1: number, x2: number, y2: number) {
    if (this.board.isEmpty(x1, y1) || this.board.isEmpty(x2, y2)) {
      // check if it has gone off the the board vertically.
      return false;
    }
    if (
      this.board.getSpace(x1, y1)?.turn.piece.index !==
        this.board.getSpace(x2, y2)?.turn.piece.index ||
      !this.board.getSpace(x1, y1)?.turn.piece.canWin ||
      !this.board.getSpace(x2, y2)?.turn.piece.canWin
    ) {
      // check if they are the same player and the pieces can win
      return false;
    }
    return true;
  }

  checkForEnd() {
    let hasDrawn = true;
    let winMessage;

    this.board.forEachSpace((x, y, content) => {
      //v h d1 d2
      if (content !== undefined) {
        let hasWonHorizontal = true;
        let hasWonVertical = true;
        let hasWonDiagonal1 = this.allowDiagonals;
        let hasWonDiagonal2 = this.allowDiagonals;
        for (let i = 1; i < this.numToConnect; i++) {
          if (!this.checkForConnect(x, y, x + i, y)) {
            hasWonHorizontal = false;
          }
          if (!this.checkForConnect(x, y, x, y + i)) {
            hasWonVertical = false;
          }
          if (!this.checkForConnect(x, y, x + i, y + i)) {
            hasWonDiagonal1 = false;
          }
          if (!this.checkForConnect(x, y, x - i, y + i)) {
            hasWonDiagonal2 = false;
          }
        }
        if (
          hasWonHorizontal ||
          hasWonVertical ||
          hasWonDiagonal1 ||
          hasWonDiagonal2
        ) {
          hasDrawn = false;
          winMessage = {
            outcome: TurnResults.WIN,
            turn: this.turns.at(this.currentTurn.index - 1) ?? 0,
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
    });
    if (winMessage !== undefined) {
      return winMessage;
    } else {
      return {
        outcome: hasDrawn ? TurnResults.DRAW : TurnResults.NORMAL,
      };
    }
  }

  computeGravity(x, y, direction) {
    let localX = x;
    if (direction.x === 1) {
      localX = 0;
    } else if (direction.x === -1) {
      localX = this.board.width - 1;
    }
    let localY = y;
    if (direction.y === 1) {
      localY = 0;
    } else if (direction.y === -1) {
      localY = this.board.height - 1;
    }

    if (direction.x !== 0 && direction.y !== 0) {
      let delta = Math.min(Math.abs(x - localX), Math.abs(y - localY));
      localX = x + delta * -direction.x;
      localY = y + delta * -direction.y;
    }
    if (this.board.isEmpty(localX, localY)) {
      for (
        let i = 0;
        i < Math.ceil((this.board.height ** 2 + this.board.width ** 2) ** 0.5); // Length of the diagonal
        i++
      ) {
        if (
          this.board.isEmpty(
            (i + 1) * direction.x + localX,
            (i + 1) * direction.y + localY
          ) ||
          !this.board.isEmpty(
            (i + 1) * direction.x + localX,
            (i + 1) * direction.y + localY
          )
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
