const SHAPES = ['cross', 'circle', 'triangle', 'square', 'diamond'];
const SYMBOLS = ['⤫', '○', '△', '□', '⬦'];

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

function generateCirclePath(x, y, size) {
  return `M ${x} ${y + size / 2} A ${size / 2} ${size / 2} 0 0 1 ${x + size} ${
    y + size / 2
  } A ${size / 2} ${size / 2} 0 0 1 ${x} ${y + size / 2}`;
}

function generateTrianglePath(x, y, size) {
  return `M ${x + size / 2} ${y} L ${x} ${y + size} L ${x + size} ${
    y + size
  } Z`;
}

function generateSquarePath(x, y, size) {
  return `M ${x} ${y} H ${size} V ${size} H ${x} Z`;
}

function generateDiamondPath(x, y, size) {
  return `M ${x + size / 2} ${y} L ${x + size} ${y + size / 2} L ${
    x + size / 2
  } ${y + size} L ${x} ${y + size / 2} Z`;
}

function hexToRgb(h) {
  return [
    ('0x' + h[1] + h[2]) | 0,
    ('0x' + h[3] + h[4]) | 0,
    ('0x' + h[5] + h[6]) | 0,
  ];
}
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function avgHex(h1, h2) {
  a = hexToRgb(h1);
  b = hexToRgb(h2);
  return rgbToHex(
    ~~((a[0] + b[0]) / 2),
    ~~((a[1] + b[1]) / 2),
    ~~((a[2] + b[2]) / 2)
  );
}
