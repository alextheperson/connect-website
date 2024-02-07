const SHAPES = ['cross', 'circle', 'triangle', 'square', 'diamond'];
const SYMBOLS = ['⤫', '○', '△', '□', '⬦'];
const DRAWERS = [drawCross, drawCircle, drawTriangle, drawSquare, drawDiamond];

const COLORS = [
  'c37d4d', // Orange
  '29ab48', // Green
  '733eaf', // Purple
  'c42860', // Red
  '2caec0', // Teal
  'bfa12c', // Gold
  '2cbf7f', // Mint
  'ba2cbf', // Pink
  'e0572f', // Safety Orange
  '2c60bf', // Blue
]; //These are Hex-Codes

let pieceShapes = {};

function generateCrossPath(x, y, size) {
  return `M ${x} ${y} L ${size + x} ${size + y} M ${x} ${size + y} L ${
    size + x
  } ${y}`;
}

function drawCross(x, y, size, color, canvas) {
  let piece = pieceShapes[`${x}-${y}-${size}-${color}`];
  if (piece === undefined) {
    piece = [];
    piece.push(
      canvas.line(x, y, x + size, y + size, {
        stroke: color,
        strokeWidth: spaceSize / 7,
        roughness: 2,
      })
    );
    piece.push(
      canvas.line(x + size, y, x, y + size, {
        stroke: color,
        strokeWidth: spaceSize / 7,
        roughness: 2,
      })
    );
    pieceShapes[`${x}-${y}-${size}-${color}`] = piece;
  } else {
    for (let i = 0; i < piece.length; i++) {
      canvas.draw(piece[i]);
    }
  }
}

function generateCirclePath(x, y, size) {
  return `M ${x} ${y + size / 2} A ${size / 2} ${size / 2} 0 0 1 ${x + size} ${
    y + size / 2
  } A ${size / 2} ${size / 2} 0 0 1 ${x} ${y + size / 2}`;
}

function drawCircle(x, y, size, color, canvas) {
  let piece = pieceShapes[`${x}-${y}-${size}-${color}`];
  if (piece === undefined) {
    piece = [];
    piece.push(
      canvas.circle(x + size / 2, y + size / 2, size, {
        stroke: color,
        strokeWidth: spaceSize / 7,
        roughness: 2,
      })
    );
    pieceShapes[`${x}-${y}-${size}-${color}`] = piece;
  } else {
    for (let i = 0; i < piece.length; i++) {
      canvas.draw(piece[i]);
    }
  }
}

function generateTrianglePath(x, y, size) {
  return `M ${x + size / 2} ${y} L ${x} ${y + size} L ${x + size} ${
    y + size
  } Z`;
}

function drawTriangle(x, y, size, color, canvas) {
  let piece = pieceShapes[`${x}-${y}-${size}-${color}`];
  if (piece === undefined) {
    piece = [];
    piece.push(
      canvas.polygon(
        [
          [x + size / 2, y],
          [x, y + size],
          [x + size, y + size],
        ],
        {
          stroke: color,
          strokeWidth: spaceSize / 7,
          roughness: 2,
          seed: (x + y) * size,
        }
      )
    );
    pieceShapes[`${x}-${y}-${size}-${color}`] = piece;
  } else {
    for (let i = 0; i < piece.length; i++) {
      canvas.draw(piece[i]);
    }
  }
}

function generateSquarePath(x, y, size) {
  return `M ${x} ${y} H ${size} V ${size} H ${x} Z`;
}

function drawSquare(x, y, size, color, canvas) {
  let piece = pieceShapes[`${x}-${y}-${size}-${color}`];
  if (piece === undefined) {
    piece = [];
    piece.push(
      canvas.rectangle(x, y, size, size, {
        stroke: color,
        strokeWidth: spaceSize / 7,
        roughness: 2,
      })
    );
    pieceShapes[`${x}-${y}-${size}-${color}`] = piece;
  } else {
    for (let i = 0; i < piece.length; i++) {
      canvas.draw(piece[i]);
    }
  }
}

function generateDiamondPath(x, y, size) {
  return `M ${x + size / 2} ${y} L ${x + size} ${y + size / 2} L ${
    x + size / 2
  } ${y + size} L ${x} ${y + size / 2} Z`;
}

function drawDiamond(x, y, size, color, canvas) {
  let piece = pieceShapes[`${x}-${y}-${size}-${color}`];
  if (piece === undefined) {
    piece = [];
    piece.push(
      canvas.polygon(
        [
          [x + size / 2, y],
          [x + size, y + size / 2],
          [x + size / 2, y + size],
          [x, y + size / 2],
        ],
        {
          stroke: color,
          strokeWidth: spaceSize / 7,
          roughness: 2,
          seed: (x + y) * size,
        }
      )
    );
    pieceShapes[`${x}-${y}-${size}-${color}`] = piece;
  } else {
    for (let i = 0; i < piece.length; i++) {
      canvas.draw(piece[i]);
    }
  }
}
