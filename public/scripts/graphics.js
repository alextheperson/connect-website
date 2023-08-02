let board, cellStyle;
let gameSettings;
let hasTurn = false;
let loaded = false;

const shapes = ['CROSS', 'CIRCLE', 'TRIANGLE', 'SQUARE'];

colors = ['c37d4d', '29ab48', '733eaf', 'c42860']; //These are Hex-Codes

// const cell = `<img class="cell" src="/tokens/${shape}.svg/${color}" />`;

function captureDOMReferences() {
  board = document.getElementById('board');
  cellStyle = document.getElementById('cell-style');
}

function createCells() {
  console.log('cells instantiated');

  board.innerHTML = '';
  for (let y = 0; y < gameSettings['height']; y++) {
    for (let x = 0; x < gameSettings['width']; x++) {
      board.innerHTML += `<button class="cell" click="placeToken(${x}, ${y})"><img class="cell-image" src="/tokens/empty.svg/000000" id="${x}-${y}"/></button>`;
    }
  }
  board.style.gridTemplateColumns = '1fr '
    .repeat(gameSettings['width'])
    .trimEnd();
  board.style.gridTemplateRows = '1fr '
    .repeat(gameSettings['height'])
    .trimEnd();
  cellStyle.innerHTML = `.board .cell {
        max-width: calc(calc(100vw - 200px) / ${gameSettings['width']});
        max-height: calc(calc(100vh - 200px) / ${gameSettings['height']});
      }`;
}
