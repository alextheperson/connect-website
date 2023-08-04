let board, cellStyle, rulesList, turnList, turnIndicator;
let gameSettings;
let hasTurn = false;
let loaded = false;
let ownNumber;
let gameBoard;

const shapes = ['cross', 'circle', 'triangle', 'square', 'diamond'];

colors = ['c37d4d', '29ab48', '733eaf', 'c42860', '2caec0']; //These are Hex-Codes

// const cell = `<img class="cell" src="/tokens/${shape}.svg/${color}" />`;

function initializeGame() {
  board = document.getElementById('board');
  cellStyle = document.getElementById('cell-style');
  rulesList = document.getElementById('rules');
  turnList = document.getElementById('turn-list');
  turnIndicator = document.getElementById('turn-indicator');

  document.getElementById(
    'game-title'
  ).innerHTML = `Connect ${gameSettings['numberToConnect']} (${gameSettings['width']}x${gameSettings['height']})`;

  document.getElementById('game').classList.remove('hidden');
  createCells();
  createRulesList();
  createTurnIndicator();
}

function createCells() {
  console.log('cells instantiated');

  board.innerHTML = '<h1 id="result"></h1>';
  for (let y = 0; y < gameSettings['height']; y++) {
    for (let x = 0; x < gameSettings['width']; x++) {
      board.innerHTML += `<button class="cell" onclick="placeToken(${x}, ${y})"><img class="cell-image" src="/tokens/empty.svg/000000" id="${x}-${y}" onmouseover="hover(${x}, ${y}, this)" onmouseout="unhover(${x}, ${y}, this)"/></button>`;
    }
  }
  board.style.gridTemplateColumns = '1fr '
    .repeat(gameSettings['width'])
    .trimEnd();
  board.style.gridTemplateRows = '1fr '
    .repeat(gameSettings['height'])
    .trimEnd();
  // cellStyle.innerHTML = `#board .cell {
  //       max-width: calc(calc(100vw - ${
  //         document.getElementById('game-info').offsetWidth
  //       }px) / ${gameSettings['width']});
  //       max-height: calc(calc(100vh - ${
  //         document.getElementById('game-title').offsetHeight
  //       }px) / ${gameSettings['height']});
  //     }`;
}

function createTurnIndicator() {
  turnList.innerHTML = '';
  for (let i = 0; i < gameSettings.turnPattern.length; i++) {
    turnList.innerHTML += `<div class="turn"><img src="/tokens/${
      shapes[gameSettings.turnPattern[i].player]
    }.svg/${colors[gameSettings.turnPattern[i].piece]}" /></div>`;
  }
}

function createRulesList() {
  rulesList.innerHTML = JSON.stringify(gameSettings, null, 4);
}

function drawTurns(turnNumber) {
  let turnHeight = turnList.children[0].offsetHeight;

  turnIndicator.style.top = turnHeight * turnNumber + 'px';
  console.log(
    'indicator moved',
    turnIndicator,
    turnIndicator.style.top,
    turnHeight * turnNumber + 'px'
  );
}

function drawBoard() {
  for (let y = 0; y < gameBoard.length; y++) {
    for (let x = 0; x < gameBoard[0].length; x++) {
      if (gameBoard[y][x] > -1) {
        document.getElementById(`${x}-${y}`).src = `/tokens/${
          shapes[gameSettings.turnPattern[gameBoard[y][x]].player]
        }.svg/${colors[gameSettings.turnPattern[gameBoard[y][x]].piece]}`;
      } else {
        document.getElementById(`${x}-${y}`).src = `/tokens/empty.svg/000000`;
      }
    }
  }
}

function drawGameEnd(arg) {
  if (arg['outcome'] === 2) {
    document.getElementById('result').innerHTML = 'DRAW';
  } else {
    document.getElementById(
      'result'
    ).innerHTML = `<img class="cell-image" src="/tokens/${
      shapes[arg['player']]
    }.svg/ffffff"/> <span>Wins!</span>
    `;
  }
}

function hover(x, y, obj) {
  if (hasTurn && gameBoard && gameBoard[y][x] === -1) {
    if (gameSettings.gravity && gameBoard[0][x] === -1) {
      for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i + 1] === undefined || gameBoard[i + 1][x] > -1) {
          let gravObj = document.getElementById(`${x}-${i}`);
          gravObj.src = `/tokens/${shapes[ownNumber]}.svg/${colors[ownNumber]}`;
          gravObj.classList.add('trans');
          break;
        }
      }
    } else {
      obj.src = `/tokens/${shapes[ownNumber]}.svg/${colors[ownNumber]}`;
      obj.classList.add('trans');
    }
  }
}

function unhover(x, y, obj) {
  drawBoard();
  transObjs = document.querySelectorAll('.cell-image.trans');
  for (let i = 0; i < transObjs.length; i++) {
    transObjs[i].classList.remove('trans');
  }
}
