let board, cellStyle, rulesList, turnList, turnIndicator;
let gameSettings;
let hasTurn = false;
let loaded = false;
let ownNumber;
let gameBoard;
let currentTurn;

// const cell = `<img class="cell" src="/tokens/${shape}.svg/${color}" />`;

function initializeGame() {
  board = document.getElementById('board');
  cellStyle = document.getElementById('cell-style');
  rulesList = document.getElementById('rules');
  turnList = document.getElementById('turn-list');
  turnIndicator = document.getElementById('turn-indicator');

  document.getElementById(
    'game-title'
  ).innerHTML = `Connect ${gameSettings.numToConnect} (${gameSettings.boardWidth}x${gameSettings.boardHeight})`;

  document.getElementById('game').classList.remove('hidden');
  createCells();
  createRulesList();
  createTurnIndicator();
}

function createCells() {
  board.innerHTML = '<h1 id="result"></h1>';
  for (let y = 0; y < gameSettings.boardHeight; y++) {
    for (let x = 0; x < gameSettings.boardWidth; x++) {
      board.innerHTML += `<button class="cell" onclick="placeToken(${x}, ${y})"><img class="cell-image" src="/tokens/empty.svg/000000" id="${x}-${y}" onmouseover="hover(${x}, ${y}, this)" onmouseout="unhover(${x}, ${y}, this)"/></button>`;
    }
  }
  board.style.gridTemplateColumns = '1fr '
    .repeat(gameSettings.boardWidth)
    .trimEnd();
  board.style.gridTemplateRows = '1fr '
    .repeat(gameSettings.boardHeight)
    .trimEnd();
  // cellStyle.innerHTML = `#board .cell {
  //       max-width: calc(calc(100vw - ${
  //         document.getElementById('game-info').offsetWidth
  //       }px) / ${gameSettings.boardWidth});
  //       max-height: calc(calc(100vh - ${
  //         document.getElementById('game-title').offsetHeight
  //       }px) / ${gameSettings.boardHeight});
  //     }`;
  console.log('cells instantiated');
}

function createTurnIndicator() {
  turnList.innerHTML = '';
  for (let i = 0; i < gameSettings.turnPattern.length; i++) {
    let { player, piece } = gameSettings.turnPattern[i];
    let tokenOwned = player == ownNumber;
    let canWin = gameSettings.pieces[piece];
    turnList.innerHTML += `<div class="turn${tokenOwned ? ' owned' : ''}${
      canWin ? '' : ' no-win'
    }" title="${tokenOwned ? 'You' : 'Other players'} can ${
      canWin ? '' : 'not '
    }use this token to win."><img src="/tokens/${SHAPES[player]}.svg/${
      COLORS[piece]
    }" /></div>`;
  }
}

function createRulesList() {
  rulesList.innerHTML = JSON.stringify(gameSettings, null, 4);
}

function drawTurns() {
  let turnHeight = turnList.children[0].offsetHeight;

  turnIndicator.style.top = turnHeight * currentTurn + 'px';
  console.log(
    'indicator moved',
    turnIndicator,
    turnIndicator.style.top,
    turnHeight * currentTurn + 'px'
  );
}

function drawBoard() {
  for (let y = 0; y < gameBoard.length; y++) {
    for (let x = 0; x < gameBoard[0].length; x++) {
      if (gameBoard[y][x] > -1) {
        document.getElementById(`${x}-${y}`).src = `/tokens/${
          SHAPES[gameSettings.turnPattern[gameBoard[y][x]].player]
        }.svg/${COLORS[gameSettings.turnPattern[gameBoard[y][x]].piece]}`;
      } else {
        document.getElementById(`${x}-${y}`).src = `/tokens/empty.svg/000000`;
      }
    }
  }
}

function drawGameEnd(arg) {
  console.log('game-end', arg);
  if (arg['outcome'] === 2) {
    document.getElementById('result').innerHTML = 'DRAW';
  } else {
    document.getElementById(
      'result'
    ).innerHTML = `<img class="cell-image" src="/tokens/${
      SHAPES[arg['player']]
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
          gravObj.src = `/tokens/${SHAPES[ownNumber]}.svg/${
            COLORS[gameSettings.turnPattern[currentTurn].piece]
          }`;
          gravObj.classList.add('trans');
          break;
        }
      }
    } else {
      obj.src = `/tokens/${SHAPES[ownNumber]}.svg/${
        COLORS[gameSettings.turnPattern[currentTurn].piece]
      }`;
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
