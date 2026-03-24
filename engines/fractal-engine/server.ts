import { glob } from 'fs';
import { GameSetting, PieceSet, TurnPattern, TurnResults } from '../../src/game';
import { Board, BoardSpace, ConnectionLine, GameEngine, Piece, Player, Turn } from '../../src/game-engine';

/**
 * The engine for the ultimate Tic-tac-toe. Any board size and any depth.
 *
 * CONCEPT - Instead of a multidimensional array of boards, this engine uses an array of "layers." This lets it use the basic {@link Board} class to check for connections. You can think of it like a pyramid.
 *```
 *   /\ - Top layer (depth - 1)
 *  /  \ - Middle Layers (n)
 * /    \ - Bottom layer (0)```
 *
 * All moves are represented by coordinates in the bottom (largest) layer. These will then be divided by the size of the beard. The integer quotient tells which board the move is in, and the remainder tell the coordinate within that board.
 *
 * What are the actual rules?
 * It's a bit tough to explain, you might want to check out {@link play-example.txt} for a better explanation.
 *  1. Play starts on any square. The coordinates of the square within its immediate parent board determines which new board to play at. This new board is usually a sibling of the parent.
 *  2. If a k-in-a-row is achieved, then the parent board is won. Play moves to a sibling of that board's **parent**.
 *  3. When k-in-a-row is achieved on the top layer board, the game has been won.
 *
 * Assumptions to make:
 *  - All boards have the same dimensions.
 *  - All tokens are ALWAYS placed in the bottom layer, but in different boards.
 *  - All plays in upper-level boards happen automatically (therefore, we can probably trust them.)
 */
export class FractalEngine implements GameEngine {
  /** These are the layers of the board. The first layer is the largest (a 2D array of boards), and each successive layer is smaller. The last layer is the one that is checked for the win-condition, and consists of a single board. */
  layers: (FractalSubBoard)[][][];

  /** The sizes of each board. */
  smallWidth: number;
  /** The sizes of each board. */
  smallHeight: number;

  /** The number of layers */
  depth: number;

  /** These coordinates go layer-by-layer, so none of them should ever be larger than the size of a board. */
  focusedBoard: { x: number, y: number }[] | null = null;

  settings: GameSetting;

  turnOrder: Turn[];
  currentTurnNumber: number = 0;
  lineLength: number;
  allowDiagonals: boolean;

  constructor(settings: GameSetting) {
    this.settings = settings

    this.smallHeight = settings.boardHeight as number;
    this.smallWidth = settings.boardWidth as number;

    this.depth = settings.depth as number;

    this.layers =
      // Create each of the layers
      Array(this.depth).fill(0).map((_, i) => {
        // Create the height of the layer (This the board size raised to decreasing powers)
        return Array(this.smallHeight ** (this.depth - i - 1)).fill(0).map(() => {
          // Create the width of the layer (The board size raised to decreasing powers)
          return Array(this.smallWidth ** (this.depth - i - 1)).fill(0).map(() => {
            // Create each of the many boards
            return new FractalSubBoard(this.smallWidth, this.smallHeight);
          });
        });
      });

    this.lineLength = this.settings.numToConnect as number;
    this.allowDiagonals = this.settings.allowDiagonals as boolean;
    this.turnOrder = Turn.fromConfiguration(this.settings.turnPattern as TurnPattern, this.settings.pieces as PieceSet);
  }

  get fullWidth() {
    return this.smallWidth ** this.depth;
  }

  get fullHeight() {
    return this.smallHeight ** this.depth;
  }

  get currentTurn(): Turn {
    return this.turnOrder[this.currentTurnNumber]
  }

  get currentPiece(): Piece {
    return this.currentTurn.piece;
  }

  get currentPlayer(): Player {
    return this.currentTurn.player;
  }

  getTurn(playerIndex: number, pieceIndex: number): Turn | null {
    return this.turnOrder.filter((turn) => turn.player.index === playerIndex && turn.piece.index === pieceIndex)[0] ?? null;
  }

  /**
   * Checks to see if the game has been won or drawn.
   * All this needs to do is check the top layer (depth - 1). If it has a k-in-a-row, then the game has been run.
   */
  checkForEnd(): { outcome: TurnResults.NORMAL | TurnResults.DRAW; } | { outcome: TurnResults.WIN; turn: Turn; direction: 'h' | 'v' | 'd1' | 'd2'; } {
    const topLayer = this.layers[this.layers.length - 1][0][0];
    const neighborSet = this.allowDiagonals ? Board.AdjacentNeighbors : Board.OrthagonalNeighbors;
    const lines = topLayer.checkForConnect(this.lineLength, neighborSet, Board.pieceCheck);

    if (lines.connections.length <= 0) {
      if (lines.full) {
        return { outcome: TurnResults.DRAW }
      } else {
        return { outcome: TurnResults.NORMAL }
      }
    } else {
      let newestLine = topLayer.getNewestLine(lines.connections);
      // I know this is diabolical, but I don't want to do the refactoring required to change this (right now at least)
      // TODO: Do that refactoring
      if (newestLine.line.direction.x == -1) {
        if (newestLine.line.direction.y == -1) {
          throw new Error("Invalid Direction")
        } else if (newestLine.line.direction.y == 0) {
          throw new Error("Invalid Direction")
        } else if (newestLine.line.direction.y == 1) {
          return { outcome: TurnResults.WIN, turn: newestLine.newestCell?.turn, direction: "d1" }
        } else {
          throw new Error("Very Invalid Direction")
        }
      } else if (newestLine.line.direction.x == 0) {
        if (newestLine.line.direction.y == -1) {
          throw new Error("Invalid Direction")
        } else if (newestLine.line.direction.y == 0) {
          throw new Error("Invalid Direction")
        } else if (newestLine.line.direction.y == 1) {
          return { outcome: TurnResults.WIN, turn: newestLine.newestCell?.turn, direction: "v" }
        } else {
          throw new Error("Very Invalid Direction")
        }
      } else if (newestLine.line.direction.x == 1) {
        if (newestLine.line.direction.y == -1) {
          throw new Error("Invalid Direction")
        } else if (newestLine.line.direction.y == 0) {
          return { outcome: TurnResults.WIN, turn: newestLine.newestCell?.turn, direction: "h" }
        } else if (newestLine.line.direction.y == 1) {
          return { outcome: TurnResults.WIN, turn: newestLine.newestCell?.turn, direction: "d2" }
        } else {
          throw new Error("Very Invalid Direction")
        }
      } else {
        throw new Error("Very Invalid Direction")
      }
    }
  }

  placeToken(x: number, y: number, turn: Turn): boolean {
    const boardCoords = this.positionInLayer(x, y, 0, 1);
    const positionInBoard = this.positionInParent(x, y);

    if (!this.validateMove(x, y, turn)) {
      return false
    }

    this.layers[0][boardCoords.y][boardCoords.x].setSpace(positionInBoard.x, positionInBoard.y, turn);
    this.currentTurnNumber += 1;
    if (this.currentTurnNumber >= this.turnOrder.length) {
      this.currentTurnNumber = 0;
    }

    // See what changes must be made
    this.update(x, y);
    return true;
  }

  validateMove(x: number, y: number, turn: Turn): boolean {
    const boardCoords = this.positionInLayer(x, y, 0, 1);
    const positionInBoard = this.positionInParent(x, y);
    const localCoords = this.globalCoordsToLocalCoords(x, y, 0);

    console.log("Board coords:")
    console.dir(boardCoords)
    console.log("Local coords:")
    console.dir(localCoords)

    if (turn.index != this.currentTurnNumber) {
      console.log("[DEBUG]: Wrong Turn")
      return false
    }

    console.log(boardCoords)
    if (!(this.layers[0][boardCoords.y][boardCoords.x].isEmpty(positionInBoard.x, positionInBoard.y) ?? false)) {
      console.log("[DEBUG]: Not empty")
      return false
    }

    if (this.focusedBoard !== null) {
      for (let i = 0; i < this.focusedBoard.length; i++) {
        if (localCoords[i + 1].x !== this.focusedBoard[i].x || localCoords[i + 1].y !== this.focusedBoard[i].y) {
          console.log(`[DEBUG]: Coords dont match
focus-coords: (${this.focusedBoard[i].x}, ${this.focusedBoard[i].y})
token coords: (${localCoords[i + 1].x}, ${localCoords[i + 1].y})`)
          return false
        } else {
          console.log(`[DEBUG]: Coords DO (yes) match
focus-coords: (${this.focusedBoard[i].x}, ${this.focusedBoard[i].y})
token coords: (${localCoords[i + 1].x}, ${localCoords[i + 1].y})`)
        }
      }
    }

    //TODO: Check if pushing the opponent to that square is allowed

    return true
  }

  update(x: number, y: number) {
    console.log("ABCACUHNASUHA")
    let currentFocusCoords = this.focusedBoard ?? Array(this.depth - 1).fill(0).map(() => ({ x: 0, y: 0 }));
    currentFocusCoords[0] = this.positionInParent(x, y);
    for (let i = 0; i < this.depth - 1; i++) {
      const boardCoords = this.positionInLayer(x, y, i, i + 1);
      const neighborSet = this.allowDiagonals ? Board.AdjacentNeighbors : Board.OrthagonalNeighbors;
      const connections = this.layers[i][boardCoords.y][boardCoords.x].checkForConnect(this.lineLength, neighborSet, Board.pieceCheck);
      if (connections.connections.length > 0) {
        const newestLine = this.layers[i][boardCoords.y][boardCoords.x].getNewestLine(connections.connections);
        const boardParentLocatation = this.positionInLayer(x, y, i, i + 2);
        const positionWithinBoard = this.positionInParent(boardCoords.x, boardCoords.y);
        this.layers[i + 1][boardParentLocatation.y][boardParentLocatation.x].setSpace(positionWithinBoard.x, positionWithinBoard.y, newestLine.newestCell.turn);

        currentFocusCoords[i] = { x: boardParentLocatation.x, y: boardParentLocatation.y };
      }
      this.focusedBoard = currentFocusCoords;
    }
  }

  /**
   * Given a position in one layer, it gives the position of that space in another layer.
   * @param x The initial x position
   * @param y The initial y position
   * @param fromLayer The layer of the starting coordinates
   * @param toLayer The new layer (must be greater than `fromLayer`)
   * @returns An object with the new x and y positions, and the layer.
   * @throws Will throw an error if `toLayer` is less than `fromLayer`, as that is ambiguous.
   */
  positionInLayer(x: number, y: number, fromLayer: number, toLayer: number) {
    const layerDifference = toLayer - fromLayer;
    if (layerDifference < 0) {
      throw new Error(`'fromLayer' (${fromLayer}) is greater than 'toLayer' (${toLayer}). This creates ambiguity, because this function doesn't know which space of the lower layer to use.`)
    }
    const newX = Math.floor(x / (this.smallWidth ** layerDifference));
    const newY = Math.floor(y / (this.smallHeight ** layerDifference));

    return { x: newX, y: newY, layer: toLayer }
  }

  /**
   * Gives the position of a space relative to its parent in the layer above.
   */
  positionInParent(x: number, y: number) {
    const newX = x % this.smallWidth;
    const newY = y % this.smallHeight;

    return { x: newX, y: newY };
  }

  /**
   * This turns a series of local coordinates (**starting from the bottom**) to global coordinates on the layer below the layer of the first coordinate.
   */
  localCoordsToGlobal(coords: { x: number, y: number }[]): { x: number, y: number } {
    let x = 0;
    let y = 0;

    coords.forEach((value, i) => {
      x += value.x * (this.smallWidth ** i)
      y += value.y * (this.smallHeight ** i)
    })

    return { x: x, y: y }
  }

  /**
   * Turns a set global coordinates in a layer into a series of local coordinates in all the layers above it.
   */
  globalCoordsToLocalCoords(x: number, y: number, layer: number): { x: number, y: number }[] {
    const coordinates = [];
    let runningX = x;
    let runningY = y;
    for (let i = this.depth - 1; i >= layer; i--) {
      const xOffset = Math.floor(runningX / (this.smallWidth ** i));
      const yOffset = Math.floor(runningY / (this.smallHeight ** i));

      runningX -= xOffset * this.smallWidth;
      runningY -= yOffset * this.smallHeight;

      coordinates.unshift({ x: xOffset, y: yOffset });
    }

    return coordinates;
  }

  sendGameState(): object {
    let packedLayers = Array(this.layers.length);
    for (let i = 0; i < this.layers.length; i++) {
      let currentLayer = this.layers[i];
      let packedLayer = Array(currentLayer.length)
      for (let j = 0; j < currentLayer.length; j++) {
        let currentRow = currentLayer[j];
        let packedRow = Array(currentRow.length)
        for (let k = 0; k < currentRow.length; k++) {
          let currentBoard = currentRow[k];
          packedRow[k] = currentBoard.packed();
        }
        packedLayer[j] = packedRow;
      }
      packedLayers[i] = packedLayer;
    }

    return {
      layers: packedLayers,
      currentTurn: this.currentTurnNumber,
      currentFocus: this.focusedBoard
    };
  }
}

/**
 * The FractalEngine needs to store additional information in each of the boards, so we extend them to add the new functionality
 */
class FractalSubBoard extends Board {
  winningLine: ConnectionLine | null = null;

  constructor(width: number, height: number) {
    super(width, height)
  }

  getNewestLine(lines: ConnectionLine[]): { line: ConnectionLine, newestCell: BoardSpace } {
    return lines
      // Get each line's newest cell
      .map((line) => {
        let newestCell = line.listSpaces()
          // Find the newest cell in the line
          .reduce((prev, current) => {
            const prevSpace = this.getSpace(prev.x, prev.y);
            const currentSpace = this.getSpace(current.x, current.y);

            if (prevSpace == undefined || currentSpace == undefined) {
              throw new Error(`One of the cells is undefined. Cells: (${prev.x}, ${prev.y}); (${current.x}, ${current.y}).`)
            }

            if ((prevSpace.age ?? 0) > (currentSpace.age ?? 0)) {
              return prev
            } else {
              return current
            }
          })

        const newestSpace = this.getSpace(newestCell.x, newestCell.y);

        if (newestSpace == undefined) {
          throw new Error(`The cell (${newestCell.x}, ${newestCell.y}) is empty. (Or maybe undefined for other reasons)`)
        }

        return { newestCell: newestSpace, line: line };
      })
      // Find the line with the newest cell
      .reduce((prev, current) => {
        if ((prev.newestCell?.age ?? 0) > (current.newestCell?.age ?? 0)) {
          return prev
        } else {
          return current
        }
      });

  }
}
