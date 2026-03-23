import { dir } from 'console';
import { PieceSet, TurnPattern, TurnResults } from './game';

/**
 * Defines a set of rules for running a game
 */
export interface GameEngine {
  /**
   * Checks whether the move is valid, ie. what turn it is, whether it obeys gravity, or if the space is filled
   * @param x The x coordinate of the piece to be placed
   * @param y The y coordinate of the piece to be placed
   * @param turn The turn the piece is getting placed with (what piece and who is placing it)
   * @returns Whether the move is valid
   */
  validateMove(x: number, y: number, turn: Turn): boolean;
  /**
   * Places a piece on the board
   * @param x The x coordinate of the piece to be placed
   * @param y The y coordinate of the piece to be placed
   * @param turn The turn the piece is getting placed with (what piece and who is placing it)
   * @returns Whether the piece could be placed (was the move valid?)
   */
  placeToken(x: number, y: number, turn: Turn): boolean;

  /**
   * Checks to see if the game has been won or drawn
   */
  checkForEnd():
    | { outcome: TurnResults.NORMAL | TurnResults.DRAW; }
    | { outcome: TurnResults.WIN; turn: Turn; direction: 'h' | 'v' | 'd1' | 'd2'; }

  /**
   * @returns a packet to send to clients telling them the state of the board
   */
  sendGameState(): object;

  /**
   * The current turn
   */
  get currentTurn(): Turn;
  /**
   * The current player
   */
  get currentPlayer(): Player;
  /**
   * The current piece
   */
  get currentPiece(): Piece;

  /**
   * Returns the turn that corresponds to a certain player and a certain piece
   * @param playerIndex The player that plays the turn
   * @param pieceIndex The piece that is played on the turn
   * @returns The turn or `null` if the turn does not exist
   */
  getTurn(playerIndex: number, pieceIndex: number): Turn | null;
}

/**
 * Represents a player in the game
 */
export class Player {
  /**
   * The number of the player. This does not necessarily represent the order of play.
   */
  index: number;
  /**
   *
   * @param index The number of the player. This is for identification purposes, and does not represent the order of play.
   */
  constructor(index: number) {
    this.index = index;
  }
}

/**
 * Represents a game piece
 */
export class Piece {
  /**
   * The index of the piece in the `gameSettings.pieces`
   */
  index: number;
  /**
   * Whether or not a player can win with the piece
   */
  canWin: boolean;
  /**
   *
   * @param index The index of the piece in `gameSettings.pieces`
   * @param canWin Whether or not a player can win with the piece
   */
  constructor(index: number, canWin: boolean) {
    this.index = index;
    this.canWin = canWin;
  }
}

/**
 * Represents one of the game's turns.
 */
export class Turn {
  /**
   *  The index of the turn in game flow. This **is** representative of turn order.
   */
  index: number;
  /**
   * The piece that gets played on this turn
   */
  piece: Piece;
  /**
   * The player that plays this turn
   */
  player: Player;
  /**
   *
   * @param index The index of the turn in game flow. This **is** representative of turn order
   * @param piece The piece that gets played on this turn
   * @param player The player that plays this turn
   */
  constructor(index: number, piece: Piece, player: Player) {
    this.piece = piece;
    this.player = player;
    this.index = index;
  }

  /**
   * Create an array of `Turn`s from a `TurnPattern`, which is what you get from the configuration.
   */
  static fromConfiguration(turns: TurnPattern, pieces: PieceSet): Turn[] {
    const turnList: Turn[] = [];

    turns.forEach((el, i) => {
      turnList.push(new Turn(
        i,
        new Piece(el.piece, (pieces)[el.piece]),
        new Player(el.player)
      ));
    });

    return turnList;
  }
}

export class ConnectionLine {
  x: number;
  y: number;
  length: number;
  direction: { x: number, y: number };

  constructor(x: number, y: number, length: number, direction: { x: number, y: number }) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.direction = direction;
  }

  get start() {
    return { x: this.x, y: this.y };
  }

  get end() {
    return {
      x: this.x + this.direction.x * this.length,
      y: this.y + this.direction.y * this.length
    };
  }

  /**
   * Return a list of all spaces that are covered by the line.
   */
  listSpaces() {
    let spaces: { x: number, y: number }[] = [];
    for (let i = 0; i < this.length; i++) {
      spaces.push({ x: this.x + this.direction.x * i, y: this.y + this.direction.y * i });
    }

    return spaces;
  }
}

export type BoardSpace = { turn: Turn; age: number };

/**
 * Represents a game board
 */
export class Board {
  private content: (BoardSpace | undefined)[][];

  /**
   * Incremented every time a piece is placed on the board.
   */
  currentAge: number = 0;

  /**
   * The width of the game board
   */
  readonly width: number;
  /**
   * The height of the game board
   */
  readonly height: number;

  /** No Diagonals: Only down & right **/
  static readonly OrthagonalNeighbors = [{ x: 0, y: 1 }, { x: 1, y: 0 }];
  /** With Diagonals: Down, Right, Southwest, and Southeast **/
  static readonly AdjacentNeighbors = [{ x: 0, y: 1 }, { x: 1, y: 0 }, { x: -1, y: 1 }, { x: 1, y: 1 }];

  /**
   * Creates a new game board with a certain width and height
   * @param width The width of the game board
   * @param height The height of the game board
   */
  constructor(width: number, height: number) {
    this.content = new Array(height)
      .fill(-1)
      .map(() => new Array(width).fill(undefined));
    this.height = height;
    this.width = width;
  }

  /**
   * Retrieves the value of a space on the game board
   * @param x The x coordinate of the space
   * @param y The y coordinate of the space
   * @returns The value of the space, or `undefined` if the space is not on the board
   */
  getSpace(x: number, y: number): BoardSpace | undefined {
    if (this.isInBounds(x, y)) {
      return this.content[y][x];
    } else {
      return undefined;
    }
  }

  /**
   * Checks if the space on the board is empty
   * @param x The x coordinate of the space
   * @param y The y coordinate of the space
   * @returns Whether the space is empty, or `undefined` if the space is not on the board
   */
  isEmpty(x: number, y: number): boolean | undefined {
    if (this.isInBounds(x, y)) {
      return this.content[y][x] === undefined;
    } else {
      return undefined;
    }
  }

  /**
   * Sets the value of a space on the game board
   * @param x The x coordinate of the space
   * @param y The y coordinate of the space
   * @param value The value to set the space to
   * @returns `undefined` if the space is not on the board
   */
  setSpace(x: number, y: number, value: Turn): void | undefined {
    if (this.isInBounds(x, y)) {
      this.content[y][x] = { turn: value, age: this.currentAge };
      this.currentAge += 1;
    } else {
      return undefined;
    }
  }

  /**
   * Clears a space on the game board (make it empty)
   * @param x The x coordinate of the space
   * @param y The y coordinate of the space
   * @returns `undefined` if the space is not on the board
   */
  clearSpace(x: number, y: number): void | undefined {
    if (this.isInBounds(x, y)) {
      this.content[y][x] = undefined;
    } else {
      return undefined;
    }
  }

  /**
   * Runs a callback function on every space of the board. It runs them sequentially from left to right and top to bottom
   * @param cb The callback function to execute
   */
  forEachSpace(cb: (x: number, y: number, content: BoardSpace | undefined) => void) {
    for (let y = 0; y < this.content.length; y++) {
      for (let x = 0; x < this.content[y].length; x++) {
        cb(x, y, this.getSpace(x, y));
      }
    }
  }

  /**
   * Packs the contents of the board so that each item is the index of the turn and empty squares are `-1`. This is what the client can handle.
   * @returns The packed board
   */
  //TODO: Rewrite the client code so this isn't needed
  packed(): number[][] {
    return this.content.map((el) => {
      return el.map((el) => {
        if (el !== undefined) {
          return el.turn.index;
        } else {
          return -1;
        }
      });
    });
  }

  /**
   * Checks if a space is on the game board
   * @param x The x coordinate of the space
   * @param y The y coordinate of the space
   * @returns Whether the space is on the board
   */
  isInBounds(x: number, y: number) {
    return y >= 0 && y < this.height && x >= 0 && x < this.width;
  }

  /**
   * Search the board for lines of pieces in a row.
   * @param minLength The minimum number of pieces required to be in a row for a successfulConnection
   * @param neigborDirections A list of offsets that list the allowable neighbors to check. *Remember that you only need half of them*.
   * @param pieceCheck A callback to check whether two pieces match.
   * @returns A an object with the list of connetions found, and whether every space on the board is full.
   */
  checkForConnect(minLength: number, neigborDirections: { x: number, y: number }[], pieceCheck: PieceCheckCallback): { connections: ConnectionLine[], full: boolean } {
    let full = true;
    let connections: ConnectionLine[] = []

    // This lists all of the spaces that have already been included in a line in that direction. This is to prevent, say a 5-long line from containing a 4-long line and two 3-long lines, etc.
    // It is indexed by [directionX][directionY][spaceX][spaceY]. It's a little cursed, I'll admit.
    let exclusions: boolean[][][][] = [];

    // Initialize the exclusion list with each of the neighbor directions
    neigborDirections.forEach((value) => {
      if (exclusions[value.x] == undefined) {
        exclusions[value.x] = [];
      }
      if (exclusions[value.x][value.y] == undefined) {
        exclusions[value.x][value.y] = [];
      }
    });

    this.forEachSpace((x, y, space) => {
      if (space === undefined) {
        full = false;
        if (minLength > 0) {
          // Because it is empty, it cannot be a part of a connection
          return
        }
      }

      let foundConnections: (ConnectionLine | null)[] = neigborDirections.map((value) => {
        // Check if this cell and direction is in the exclusion list.
        if ((((exclusions[value.x] ?? [])[value.y] ?? [])[x] ?? [])[y] ?? false) {
          return null
        }
        let foundLine = this.checkDirection(x, y, value, pieceCheck);
        foundLine.listSpaces().forEach((lineSpace) => {
          // Add this cell and direction to the exclusion list (and add the cell coordinates if needed)
          if (exclusions[value.x][value.y][lineSpace.x] == undefined) {
            exclusions[value.x][value.y][lineSpace.x] = [];
          }
          exclusions[value.x][value.y][lineSpace.x][lineSpace.y] = true;
        });
        return foundLine;
      });

      // Why not a filter()? The reason is that TypeScript doesn't think that it guarantees the list will be free from nulls.
      let validConnections: ConnectionLine[] = [];
      foundConnections.forEach((connection) => {
        if (connection !== null && connection.length >= minLength) {
          validConnections.push(connection);
        }
      });

      connections.push(...validConnections);
    })

    return { connections: connections, full: full }
  }

  /**
   * Check in a direction from a starting cell. In reports how many cells in that direction match the starting cell.
   * @param x The starting x position
   * @param y The starting y position
   * @param direction The direction of the line
   * @param pieceCheck The callback function to determine whether two pieces match.
   * @returns A `ConnectionLine` object represinting the line, with a `length` equal to the number of spaces in a row that match. The length is 0 if the starting square is empty.
   */
  checkDirection(x: number, y: number, direction: { x: number, y: number }, pieceCheck: PieceCheckCallback): ConnectionLine {
    // Trivial case (the starting space is empty)
    if (this.isEmpty(x, y)) {
      return new ConnectionLine(x, y, 0, direction);
    }

    let lastX = x;
    let lastY = y;
    let lastSpace = this.getSpace(lastX, lastY);

    let currentX = x + direction.x;
    let currentY = y + direction.y;
    let currentSpace = this.getSpace(currentX, currentY);

    let length = 1;

    while (lastSpace !== undefined && currentSpace !== undefined && pieceCheck(lastSpace, currentSpace)) {
      lastX = currentX;
      lastY = currentY;
      lastSpace = this.getSpace(lastX, lastY);

      currentX += direction.x;
      currentY += direction.y;
      currentSpace = this.getSpace(currentX, currentY);

      length += 1;
    }

    return new ConnectionLine(x, y, length, direction);
  }

  /**
   * Check whether two spaces are compatible for a k-in-a-row. That is, whether the pieces are the same, and they are both able to win a game.
   */
  static pieceCheck(space1: BoardSpace, space2: BoardSpace): boolean {
    return space1.turn.piece.index == space2.turn.piece.index && space1.turn.piece.canWin && space2.turn.piece.canWin
  }
}

export type NeighborCallback = ((x: number, y: number) => { x: number, y: number }[]);
export type PieceCheckCallback = ((space1: BoardSpace, space2: BoardSpace) => boolean);

