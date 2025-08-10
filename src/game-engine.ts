import { TurnResults } from './game';

export type GameResult<t> =
  | { outcome: TurnResults.NORMAL }
  | {
    outcome: TurnResults.DRAW;
    lines: Line<t>[];
  }
  | {
    outcome: TurnResults.WIN;
    player: Player;
    lines: Line<t>[];
  };

/**
 * Defines a set of rules for running a game
 */
export interface GameEngine {
  /**
   * Places a piece on the board
   * @param x The x coordinate of the piece to be placed
   * @param y The y coordinate of the piece to be placed
   * @param turn The turn the piece is getting placed with (what piece and who is placing it)
   * @returns Whether the piece could be placed (was the move valid?)
   */
  placeToken(arg: any, turn: Turn): boolean;

  /**
   * Checks to see if the game has been won or drawn
   */
  checkForEnd(): GameResult<Turn>;

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
}

export type BoardSpace<t> = { turn: t; age: number };

/**
 * Represents a game board
 */
export class Board {
  private content: (BoardSpace<Turn> | undefined)[][];

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
  getSpace(x: number, y: number): BoardSpace<Turn> | undefined {
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
  forEachSpace(cb: (x: number, y: number, content: BoardSpace<Turn>) => void) {
    for (let y = 0; y < this.content.length; y++) {
      for (let x = 0; x < this.content[y].length; x++) {
        cb(x, y, this.getSpace(x, y) as BoardSpace<Turn>);
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
}

export type BoardCoordinates = number[];
export type LineAngle = (1 | 0 | -1)[];
export type NestedArray<t> = NestedArray<t>[] | t[];
export type Line<t> = {
  cells: { content: t; coords: BoardCoordinates }[];
  newestCell: { content: t; coords: BoardCoordinates };
};

/**
 * Stores items of type `t` in a multidimensional grid.
 */
export class MultidimensionalBoard<t> {
  dimensions: number[];
  cells: (BoardSpace<t> | null)[];
  readonly dimensionality: number;
  private currentAge = 0;

  /**
   *
   * @param dimensions The dimensions of the board (`x`, `y`, `z`, etc.).
   */
  constructor(...dimensions: number[]) {
    this.dimensions = dimensions;
    this.cells = new Array(
      this.dimensions.reduce((previous, current) => previous * current)
    ).fill(null);
    this.dimensionality = dimensions.length;
  }

  checkBounds(...coordinates: BoardCoordinates) {
    for (let i = 0; i < coordinates.length; i++) {
      if (coordinates[i] < 0 || coordinates[i] > this.dimensions[i] - 1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Converts a set of coordinates into a position in the cell array.
   * @param coordinates
   * @returns
   */
  coordinatesToIndex(...coordinates: BoardCoordinates) {
    if (coordinates.length !== this.dimensionality) {
      throw new Error(
        `Only received ${coordinates.length} coordinates, but this is a ${this.dimensionality} dimensional board`
      );
    }
    if (!this.checkBounds(...coordinates)) {
      throw new Error(
        `The position (${coordinates.join(
          ', '
        )}) is outside of the board (which is ${this.dimensions.join('x')})`
      );
    }
    let index = 0;
    for (let i = 0; i < coordinates.length; i++) {
      const previousDimensions = this.dimensions.slice(0, i);
      const offset =
        i > 0
          ? previousDimensions.reduce((previous, current) => current * previous)
          : 1;
      index += coordinates[i] * offset;
    }
    return index;
  }

  /**
   * Takes the index of a cell in the cell array, and returns its coordinates on the board.
   * @param index
   * @returns
   */
  indexToCoordinates(index: number): BoardCoordinates {
    let coordinates: number[] = new Array(this.dimensionality);
    let _index = index;

    for (let i = this.dimensionality - 1; i >= 0; i--) {
      const previousDimensions = this.dimensions.slice(0, i);
      const offset =
        i > 0
          ? previousDimensions.reduce((previous, current) => current * previous)
          : 1;
      const remainder = Math.floor(_index / offset);
      _index -= remainder * offset;
      coordinates[i] = remainder;
    }

    return coordinates;
  }

  static compareCoordinates(
    coordinate1: BoardCoordinates,
    coordinate2: BoardCoordinates
  ) {
    if (coordinate1.length !== coordinate2.length) {
      return false;
    }

    for (let i = 0; i < coordinate1.length; i++) {
      if (coordinate1[i] !== coordinate2[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Gets the content of a certain board cell.
   * @param coordinates
   * @returns
   */
  getCell(...coordinates: BoardCoordinates): t | null {
    return this.cells[this.coordinatesToIndex(...coordinates)]?.turn ?? null;
  }

  /**
   * Gets the age of a certain board cell.
   * @param coordinates
   * @returns
   */
  getAge(...coordinates: BoardCoordinates): number | null {
    return this.cells[this.coordinatesToIndex(...coordinates)]?.age ?? null;
  }

  /**
   * Gets the content and age of a certain board cell.
   * @param coordinates
   * @returns
   */
  getWholeCell(...coordinates: BoardCoordinates): BoardSpace<t> | null {
    return this.cells[this.coordinatesToIndex(...coordinates)];
  }

  /**
   * Returns true if the cell is empty (is `null`), and false if it has content. It is the opposite of `isOccupied()`.
   * @param coordinates
   * @returns
   */
  isEmpty(...coordinates: BoardCoordinates) {
    return this.getCell(...coordinates) === null;
  }

  /**
   * Returns true if the cell has content, false if it is empty. It is the opposite of `isEmpty()`.
   * @param coordinates
   * @returns
   */
  isOccupied(...coordinates: BoardCoordinates) {
    return !this.isEmpty(...coordinates);
  }

  /**
   * Set the value of the board at a certain cell, or set it to null.
   * @param value
   * @param coordinates
   * @returns The new value of the board cell.
   */
  setCell(value: t | null, ...coordinates: BoardCoordinates) {
    let index = this.coordinatesToIndex(...coordinates);
    if (value === null) {
      this.cells[index] = null;
    } else {
      this.cells[index] = { turn: value, age: this.currentAge };
    }

    this.currentAge += 1;

    return this.cells[index];
  }

  /**
   * Set the value of a cell, but never make it null.
   * @param value
   * @param coordinates
   */
  writeCell(value: t, ...coordinates: BoardCoordinates) {
    this.setCell(value, ...coordinates);

    this.currentAge += 1;
  }

  /**
   * Make a cell empty (by making it null).
   * @param coordinates
   */
  clearSpace(...coordinates: BoardCoordinates) {
    this.setCell(null, ...coordinates);

    this.currentAge += 1;
  }

  /**
   * Takes an array of grid cells and copies it to this board.
   */
  copyTo(cells: t[]) {
    if (cells.length !== this.cells.length) {
      throw new Error(
        'The dimensions of the board to be copied is not the same as this board.'
      );
    }

    cells.forEach((val, i) => {
      this.setCell(val, ...this.indexToCoordinates(i));
    });
  }

  /**
   * Runs a callback for every cell on the board. For empty cells, the age is null.
   * @param cb
   * @returns Returns itself for convenience.
   */
  forEach(
    cb: (
      content: t | null,
      age: number | null,
      coords: BoardCoordinates
    ) => void
  ) {
    for (let i = 0; i < this.cells.length; i++) {
      cb(
        this.cells[i]?.turn ?? null,
        this.cells[i]?.age ?? null,
        this.indexToCoordinates(i)
      );
    }
    return this;
  }

  /**
   * Populates the board with a callback function.
   * @param cb
   * @returns This object, to facilitate method chaining.
   */
  fill(cb: (coords: BoardCoordinates) => t | null) {
    for (let i = 0; i < this.cells.length; i++) {
      let coordinates = this.indexToCoordinates(i);
      this.setCell(cb(coordinates), ...coordinates);
    }
    return this;
  }

  /**
   * Runs a callback for every cell on the board, and returns a new board with the results of the function calls. Does not modify the original board.
   * @param cb
   * @returns
   */
  map(
    cb: (
      content: t | null,
      age: number | null,
      coords: BoardCoordinates
    ) => t | null
  ) {
    const cellSwap = structuredClone(this.cells);
    for (let i = 0; i < this.cells.length; i++) {
      let value = cb(
        this.cells[i]?.turn ?? null,
        this.cells[i]?.age ?? null,
        this.indexToCoordinates(i)
      );
      if (value === null) {
        cellSwap[i] = null;
      } else {
        cellSwap[i] = { turn: value, age: i };
      }
    }
    return cellSwap;
  }

  /**
   * This function finds lines of cells. A line of cells are cells that are separated by either 1 or 0 in every axis, and that match according to the matching function.
   * @param threshold The number of `true`s that need to be in a line.
   * @param matcher A function that determines which cells can for a line with each other (eg. checks if they are owned by the same player).
   * @param allowDiagonals Allows lines to be diagonal. Otherwise, there can only be one axis with a separation other than 0.
   */
  findLines(
    threshold: number,
    matcher: (
      cell1: t,
      coords1: BoardCoordinates,
      cell2: t,
      coords2: BoardCoordinates
    ) => boolean,
    allowDiagonals: boolean
  ): Line<t>[] {
    let lines: Line<t>[] = [];

    function checkNextDimension(
      start: BoardCoordinates,
      angle: LineAngle,
      thisObject: MultidimensionalBoard<t>
    ) {
      if (
        angle.length >= thisObject.dimensionality &&
        (angle.includes(1) || angle.includes(-1))
      ) {
        let cells: number[][] = [];
        for (let i = 0; i < threshold; i++) {
          let currentCell = start.map(
            (value, index) => value + angle[index] * i
          );
          if (
            !thisObject.checkBounds(...start) ||
            !thisObject.checkBounds(...currentCell)
          ) {
            return;
          }
          cells.push(currentCell);
          let cell1 = thisObject.getCell(...start);
          let cell2 = thisObject.getCell(...currentCell);
          if (
            cell1 === null ||
            cell2 === null ||
            !matcher(cell1, start, cell2, currentCell)
          ) {
            return;
          }
        }
        try {
          let newestCellCoords = cells.sort((a, b) => {
            let firstContent = thisObject.getAge(...a);
            let secondContent = thisObject.getAge(...b);
            if (firstContent === null || secondContent === null) {
              throw new Error('Cell was empty??');
            }
            return secondContent - firstContent;
          })[0];
          let newestCellContent = thisObject.getCell(...newestCellCoords);
          if (newestCellContent === null) {
            throw new Error('Cell was empty??');
          }
          lines.push({
            cells: cells.map((val) => {
              let cellContent = thisObject.getCell(...val);
              if (cellContent === null) {
                throw new Error('Cell was empty??');
              }
              return { content: cellContent, coords: val };
            }),
            newestCell: {
              content: newestCellContent,
              coords: newestCellCoords,
            },
          });
        } catch {
          return;
        }
      } else if (angle.length < thisObject.dimensionality) {
        if ((!angle.includes(1) && !angle.includes(-1)) || allowDiagonals) {
          checkNextDimension(start, [...angle, 1], thisObject);
          checkNextDimension(start, [...angle, -1], thisObject);
        }
        checkNextDimension(start, [...angle, 0], thisObject);
      }
    }

    this.forEach((content, age, coords) =>
      checkNextDimension(coords, [], this)
    );

    lines.forEach((line1, index1) => {
      lines.forEach((line2, index2) => {
        if (index1 === index2) {
          return;
        }
        if (
          (MultidimensionalBoard.compareCoordinates(
            line1.cells.at(0)?.coords ?? [0],
            line2.cells.at(0)?.coords ?? [0]
          ) &&
            MultidimensionalBoard.compareCoordinates(
              line1.cells.at(-1)?.coords ?? [0],
              line2.cells.at(-1)?.coords ?? [0]
            )) ||
          (MultidimensionalBoard.compareCoordinates(
            line1.cells.at(0)?.coords ?? [0],
            line2.cells.at(-1)?.coords ?? [0]
          ) &&
            MultidimensionalBoard.compareCoordinates(
              line1.cells.at(-1)?.coords ?? [0],
              line2.cells.at(0)?.coords ?? [0]
            ))
        ) {
          lines.splice(index2, 1);
        }
        console.log('removed');
      });
    });

    return lines;
  }
  asNestedArrays(): NestedArray<t | null> {
    let packedBoard: NestedArray<t | null> = this.cells.map(
      (val) => val?.turn ?? null
    );
    for (let i = 0; i < this.dimensionality - 1; i++) {
      let intermediateBoard: NestedArray<t | null>[] = [];
      for (let j = 0; j < packedBoard.length; j += this.dimensions[i]) {
        let section: NestedArray<t | null> = packedBoard.slice(
          j,
          j + this.dimensions[i]
        ) as NestedArray<t | null>;
        intermediateBoard.push(section);
      }
      packedBoard = intermediateBoard;
    }
    return packedBoard;
  }
}
