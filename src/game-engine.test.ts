import test, { describe } from "node:test";
import { Board, Piece, Player, Turn } from "./game-engine";
import assert from "assert";

describe("game-engine/Board", () => {
  test("Board.setSpace", () => {
    const board = new Board(3, 3);
    const turn = new Turn(0, new Piece(0, true), new Player(0));

    // Test that it writes the space
    board.setSpace(0, 0, turn);
    let boardContent = Reflect.get(board, "content");
    assert.deepStrictEqual(boardContent[0][0], { age: 0, turn: turn });

    // Test the age increments
    board.setSpace(1, 0, turn);
    boardContent = Reflect.get(board, "content");
    assert.deepStrictEqual(boardContent[0][1], { age: 1, turn: turn });

    // Test returns
    assert.strictEqual(board.setSpace(3, 1, turn), undefined);
  })

  test("Board.getSpace()", () => {
    const board = new Board(3, 3);

    // Test that it reads the space
    const turn = new Turn(0, new Piece(0, true), new Player(0));
    board.setSpace(1, 1, turn);
    assert.deepStrictEqual(board.getSpace(1, 1), { age: 0, turn: turn });

    // Test the returns
    assert.strictEqual(board.getSpace(2, 1), undefined);
  })

  test("Board.isEmpty()", () => {
    const board = new Board(4, 3);

    // Test on empty cell
    assert(board.isEmpty(1, 2));

    // Test on non-empty cell
    board.setSpace(0, 1, new Turn(0, new Piece(0, true), new Player(0)));
    assert(!board.isEmpty(0, 1));

    // Test returns
    assert.strictEqual(board.isEmpty(5, 5), undefined);
  })

  test("Board.clearSpace()", () => {
    const board = new Board(3, 3);
    const turn = new Turn(0, new Piece(0, true), new Player(0));

    board.setSpace(1, 0, turn);
    board.clearSpace(1, 0)

    assert(board.isEmpty(1, 0))
  })

  test("Board.forEachSpace()", () => {
    const width = 5;
    const height = 3;
    const board = new Board(width, height);

    let counter = 0;
    let hitAreas = Array(height).fill(0).map(() => Array(width).fill(0).map(() => false));
    board.forEachSpace((x, y, content) => {
      counter += 1;
      hitAreas[y][x] = true;
      assert.strictEqual(content, board.getSpace(x, y));
    })

    assert.equal(counter, width * height);
    assert.deepStrictEqual(hitAreas, Array(height).fill(0).map(() => Array(width).fill(0).map(() => true)))
  })

  test("Board.packed()", () => {
    const board = new Board(3, 3);
    const turn1 = new Turn(0, new Piece(0, true), new Player(0))
    const turn2 = new Turn(1, new Piece(1, true), new Player(2))
    const turn3 = new Turn(2, new Piece(2, false), new Player(3))

    board.setSpace(0, 1, turn1);
    board.setSpace(2, 2, turn2);
    board.setSpace(2, 1, turn3);

    const packed = board.packed();

    assert.deepStrictEqual(packed, [[-1, -1, -1], [0, -1, 2], [-1, -1, 1]])
  })

  test("Board.isInBounds()", () => {
    const squareBoard = new Board(3, 3);
    assert(squareBoard.isInBounds(0, 0))
    assert(squareBoard.isInBounds(1, 1))
    assert(squareBoard.isInBounds(2, 2))

    assert(!squareBoard.isInBounds(-1, -1))
    assert(!squareBoard.isInBounds(3, 3))

    const rectangularBoard = new Board(7, 6);
    assert(rectangularBoard.isInBounds(0, 0))
    assert(rectangularBoard.isInBounds(5, 5))
    assert(rectangularBoard.isInBounds(6, 5))

    assert(!rectangularBoard.isInBounds(-1, -1))
    assert(!rectangularBoard.isInBounds(7, 5))
    assert(!rectangularBoard.isInBounds(6, 6))
    assert(!rectangularBoard.isInBounds(7, 6))
  })
});
