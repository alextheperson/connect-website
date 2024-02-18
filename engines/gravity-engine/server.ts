import { GameSetting, TurnPattern, TurnResults, Vector } from '../../src/game';
import { Board, GameEngine, Piece, Player, Turn } from '../../src/game-engine';

export class GravityEngine implements GameEngine {
  board: Board;

  turns: Turn[] = [];

  numToConnect: number;
  allowDiagonals: boolean;
  doGravity: boolean;

  currentTurnNumber: number;

  settings: GameSetting;
  gravityIndex = 0;

  gravityAngles: Vector[];

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
    this.gravityAngles = settings.gravityPattern as Vector[];

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
      gravityIndex: this.gravityIndex,
    };
  }

  placeToken(x: number, y: number, turn: Turn): boolean {
    if (this.validateMove(x, y, turn)) {
      let newPos = this.computeGravity(
        x,
        y,
        this.gravityAngles[this.gravityIndex].x,
        this.gravityAngles[this.gravityIndex].y
      );
      this.board.setSpace(newPos?.x ?? x, newPos?.y ?? y, turn);
      this.currentTurnNumber += 1;
      if (this.currentTurnNumber >= this.turns.length) {
        this.currentTurnNumber = 0;
        this.gravityIndex += 1;
        if (this.gravityIndex >= this.gravityAngles.length) {
          this.gravityIndex = 0;
        }
        this.applyGravityToBoard(
          this.gravityAngles[this.gravityIndex].x,
          this.gravityAngles[this.gravityIndex].y
        );
      }
      return true;
    } else {
      return false;
    }
  }

  validateMove(x: number, y: number, turn: Turn): boolean {
    return (
      turn.index == this.currentTurnNumber &&
      (this.board.isEmpty(x, y) ?? false)
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
        let newestPiece = content;

        let hasWonHorizontal = true;
        let hasWonVertical = true;
        let hasWonDiagonal1 = this.allowDiagonals;
        let hasWonDiagonal2 = this.allowDiagonals;
        for (let i = 1; i < this.numToConnect; i++) {
          if (!this.checkForConnect(x, y, x + i, y)) {
            hasWonHorizontal = false;
          } else {
            const currentPiece = this.board.getSpace(x + i, y);
            if (
              currentPiece?.age !== undefined &&
              currentPiece.age > newestPiece.age
            ) {
              newestPiece = currentPiece;
            }
          }
          if (!this.checkForConnect(x, y, x, y + i)) {
            hasWonVertical = false;
          } else {
            const currentPiece = this.board.getSpace(x, y + i);
            if (
              currentPiece?.age !== undefined &&
              currentPiece.age > newestPiece.age
            ) {
              newestPiece = currentPiece;
            }
          }
          if (!this.checkForConnect(x, y, x + i, y + i)) {
            hasWonDiagonal1 = false;
          } else {
            const currentPiece = this.board.getSpace(x + i, y + i);
            if (
              currentPiece?.age !== undefined &&
              currentPiece.age > newestPiece.age
            ) {
              newestPiece = currentPiece;
            }
          }
          if (!this.checkForConnect(x, y, x - i, y + i)) {
            hasWonDiagonal2 = false;
          } else {
            const currentPiece = this.board.getSpace(x - i, y + i);
            if (
              currentPiece?.age !== undefined &&
              currentPiece.age > newestPiece.age
            ) {
              newestPiece = currentPiece;
            }
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
            turn: newestPiece.turn,
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

  applyGravityToBoard(dx: -1 | 0 | 1, dy: -1 | 0 | 1) {
    const bottomCells: number[][] = [];
    if (dy === -1) {
      // up
      bottomCells.push(
        ...new Array(this.board.width).fill([0, 0]).map((val, i) => [i, 0])
      );
    }
    if (dy === 1) {
      // down
      bottomCells.push(
        ...new Array(this.board.width)
          .fill([0, 0])
          .map((val, i) => [i, this.board.height - 1])
      );
    }
    if (dx === -1) {
      //left
      bottomCells.push(
        ...new Array(this.board.height).fill([0, 0]).map((val, i) => [0, i])
      );
    }
    if (dx === 1) {
      // right
      bottomCells.push(
        ...new Array(this.board.height)
          .fill([0, 0])
          .map((val, i) => [this.board.width - 1, i])
      );
    }

    bottomCells.forEach((val) => {
      const initialX = val[0];
      const initialY = val[1];
      let x = initialX;
      let y = initialY;
      let movedTokens = 0;

      while (
        x >= 0 &&
        x < this.board.width &&
        y >= 0 &&
        y < this.board.height
      ) {
        const currentSpace = this.board.getSpace(x, y);
        if (currentSpace !== undefined) {
          this.board.clearSpace(x, y);
          this.board.setSpace(
            initialX - dx * movedTokens,
            initialY - dy * movedTokens,
            currentSpace.turn
          );
          movedTokens += 1;
        }
        x -= dx;
        y -= dy;
      }
    });
  }

  computeGravity(initialX: number, initialY: number, dx: number, dy: number) {
    let x = initialX;
    let y = initialY;

    while (x >= 0 && x < this.board.width && y >= 0 && y < this.board.height) {
      const currentSpace = this.board.getSpace(x, y);
      if (currentSpace !== undefined) {
        return { x: x - dx, y: y - dy };
      }
      x += dx;
      y += dy;
    }

    return { x: x - dx, y: y - dy };
  }
}
