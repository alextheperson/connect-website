import { TurnResults } from './game';

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
    | { outcome: TurnResults }
    | { outcome: TurnResults; turn: Turn; direction: 'h' | 'v' | 'd1' | 'd2' };

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
  getTurn(playerIndex, pieceIndex): Turn | null;
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
}

/**
 * Represents a game board
 */
export class Board {
  private content: (Turn | undefined)[][];

  /**
   * The width of the game board
   */
  readonly width: number;
  /**
   * The height of the game board
   */
  readonly height: number;

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
  getSpace(x: number, y: number): Turn | undefined {
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
      this.content[y][x] = value;
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
  forEachSpace(cb: (x: number, y: number, content: Turn) => void) {
    for (let y = 0; y < this.content.length; y++) {
      for (let x = 0; x < this.content[y].length; x++) {
        cb(x, y, this.getSpace(x, y) as Turn);
      }
    }
  }

  /**
   * Packs the contents of the board so that each item is the index of the turn and empty squares are `-1`. This is what the client handles
   * @returns The packed board
   */
  //TODO: Rewrite the client code so this isn't needed
  packed(): number[][] {
    return this.content.map((el) => {
      return el.map((el) => {
        if (el !== undefined) {
          return el.index;
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
  isInBounds(x, y) {
    return y >= 0 && y < this.height && x >= 0 && x < this.width;
  }
}
