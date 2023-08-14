let board, cellStyle, rulesList, turnList, turnIndicator;
let gameSettings;
let hasTurn = false;
let loaded = false;
let ownNumber;
let gameBoard;
let currentTurn;
let gameFinished = false;

// const cell = `<img class="cell" src="/tokens/${shape}.svg/${color}" />`;

function initializeGame() {
  board = document.getElementById('board');
  cellStyle = document.getElementById('cell-style');
  rulesList = document.getElementById('rules');
  turnList = document.getElementById('turns');
  turnIndicator = document.getElementById('turn-indicator');

  // document.getElementById(
  //   'game-title'
  // ).innerHTML = `Connect ${gameSettings.numToConnect} (${gameSettings.boardWidth}x${gameSettings.boardHeight})`;

  document.getElementById('game').classList.remove('hidden');
  createCells();
  createRulesList();
  createTurnIndicator();
}

function createCells() {
  let aspectRatio = gameSettings.boardWidth / gameSettings.boardHeight;
  board.style.width = aspectRatio * board.offsetHeight + 'px';
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
    // <div class="turn-indicator hidden" id="turn-${i}"></div>
    turnList.innerHTML += `<div id="turn-${i}" class="current-turn turn${
      tokenOwned ? ' owned' : ''
    }${canWin ? '' : ' no-win'}" title="${
      tokenOwned ? 'You' : 'Other players'
    } can ${canWin ? '' : 'not '}use this token to win."><img src="/tokens/${
      SHAPES[player]
    }.svg/${COLORS[piece]}" /></div>`;
  }
}

function createRulesList() {
  // rulesList.innerHTML = JSON.stringify(gameSettings, null, 4);
}

function drawTurns() {
  Array.from(document.getElementsByClassName('turn')).map((el) =>
    el.classList.remove('current-turn')
  );
  document.getElementById(`turn-${currentTurn}`).classList.add('current-turn');
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
  gameFinished = true;
  if (arg['outcome'] === 2) {
    document.getElementById('result').innerHTML = 'DRAW';
  } else {
    document.getElementById(
      'result'
    ).innerHTML = `<img class="cell-image" src="/tokens/${
      SHAPES[arg.turn.player.index]
    }.svg/ffffff"/> <span>Wins!</span>
    `;
  }
}

function hover(x, y, obj) {
  if (!gameFinished && hasTurn && gameBoard && gameBoard[y][x] === -1) {
    if (gameSettings.hasGravity) {
      let computeResult = computeGravity(x, y);
      if (computeResult !== null) {
        let computedX = computeResult.x;
        let computedY = computeResult.y;
        let gravityObj = document.getElementById(`${computedX}-${computedY}`);
        gravityObj.src = `/tokens/${SHAPES[ownNumber]}.svg/${
          COLORS[gameSettings.turnPattern[currentTurn].piece]
        }`;
        gravityObj.classList.add('trans');
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

function computeGravity(x, y) {
  let { gravityDirection } = gameSettings;
  let localX = x;
  if (gravityDirection.x === 1) {
    localX = 0;
  } else if (gravityDirection.x === -1) {
    localX = gameSettings.boardWidth - 1;
  }
  let localY = y;
  if (gravityDirection.y === 1) {
    localY = 0;
  } else if (gravityDirection.y === -1) {
    localY = gameSettings.boardHeight - 1;
  }

  if (gravityDirection.x !== 0 && gravityDirection.y !== 0) {
    let delta = Math.min(Math.abs(x - localX), Math.abs(y - localY));
    localX = x + delta * -gravityDirection.x;
    localY = y + delta * -gravityDirection.y;
  }
  if (gameBoard[localY][localX] === -1) {
    for (
      let i = 0;
      i < Math.ceil(gameBoard.length ** 2 + (gameBoard[1].length ** 2) ** 0.5); // Length of the diagonal
      i++
    ) {
      if (
        gameBoard[(i + 1) * gravityDirection.y + localY] === undefined ||
        gameBoard[(i + 1) * gravityDirection.y + localY][
          (i + 1) * gravityDirection.x + localX
        ] === undefined ||
        gameBoard[(i + 1) * gravityDirection.y + localY][
          (i + 1) * gravityDirection.x + localX
        ] > -1
      ) {
        return {
          x: i * gravityDirection.x + localX,
          y: i * gravityDirection.y + localY,
        };
      }
    }
  }
  return null;
}
