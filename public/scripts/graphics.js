let board, cellStyle, rulesList, turnList, turnIndicator, canvas;
let gameSettings;
let hasTurn = false;
let loaded = false;
let ownNumber;
let gameBoard;
let currentTurn;
let gameFinished = false;
let spaceSize = 0;
let ending;

let boardShapes = [];

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
  canvas = rough.canvas(document.getElementById('board'));
  canvas.rectangle(10, 10, 200, 200); // x, y, width, height
  board.addEventListener('mousemove', hover);
  board.addEventListener('mouseout', () => {
    if (!gameFinished) {
      drawBoard();
    }
  });
  board.addEventListener('click', click);
  createCells();
  createRulesList();
  createTurnIndicator();
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

function createCells() {
  let aspectRatio = gameSettings.boardWidth / gameSettings.boardHeight;
  board.style.width = aspectRatio * board.offsetHeight + 'px';
  board.width = aspectRatio * board.offsetHeight;
  board.height = board.offsetHeight;

  spaceSize = board.width / gameSettings.boardWidth;

  for (let i = 1; i < gameSettings.boardWidth; i++) {
    boardShapes.push(
      canvas.line(i * spaceSize, 0, i * spaceSize, board.height, {
        strokeWidth: spaceSize / 15,
        roughness: 1,
        seed: 1,
      })
    );
  }

  for (let i = 1; i < gameSettings.boardHeight; i++) {
    boardShapes.push(
      canvas.line(0, i * spaceSize, board.width, i * spaceSize, {
        strokeWidth: spaceSize / 15,
        roughness: 1,
        seed: 1,
      })
    );
  }
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
  let padding = spaceSize / 20;
  board.getContext('2d').clearRect(0, 0, board.width, board.height);
  for (let i = 0; i < boardShapes.length; i++) {
    canvas.draw(boardShapes[i]);
  }
  for (let y = 0; y < gameBoard.length; y++) {
    for (let x = 0; x < gameBoard[0].length; x++) {
      if (gameBoard[y][x] > -1) {
        DRAWERS[gameSettings.turnPattern[gameBoard[y][x]].player](
          x * spaceSize + padding,
          y * spaceSize + padding,
          spaceSize - padding * 2,
          `#${COLORS[gameSettings.turnPattern[gameBoard[y][x]].piece]}`,
          canvas
        );
      }
    }
  }
  if (gameFinished) {
    drawGameEnd(ending);
  }
}

function drawGameEnd(arg) {
  console.log('game-end', arg);
  gameFinished = true;
  ending = arg;
  switch (arg.direction) {
    case 'h':
      canvas.line(
        arg.position.x * spaceSize,
        arg.position.y * spaceSize + spaceSize / 2,
        (arg.position.x + gameSettings.numToConnect) * spaceSize,
        arg.position.y * spaceSize + spaceSize / 2,
        {
          strokeWidth: 5,
          roughness: 5,
          stroke: `#${COLORS[arg.turn.piece.index]}`,
        }
      );
      break;
    case 'v':
      canvas.line(
        arg.position.x * spaceSize + spaceSize / 2,
        arg.position.y * spaceSize,
        arg.position.x * spaceSize + spaceSize / 2,
        (arg.position.y + gameSettings.numToConnect) * spaceSize,
        {
          strokeWidth: 5,
          roughness: 5,
          stroke: `#${COLORS[arg.turn.piece.index]}`,
        }
      );
      break;
    case 'd1':
      canvas.line(
        arg.position.x * spaceSize + spaceSize / 2,
        arg.position.y * spaceSize + spaceSize / 2,
        (arg.position.x + gameSettings.numToConnect) * spaceSize -
          spaceSize / 2,
        (arg.position.y + gameSettings.numToConnect) * spaceSize -
          spaceSize / 2,
        {
          strokeWidth: 5,
          roughness: 5,
          stroke: `#${COLORS[arg.turn.piece.index]}`,
        }
      );
      break;
    case 'd2':
      canvas.line(
        arg.position.x * spaceSize + spaceSize / 2,
        arg.position.y * spaceSize + spaceSize / 2,
        (arg.position.x - gameSettings.numToConnect) * spaceSize +
          spaceSize * 1.5,
        (arg.position.y + gameSettings.numToConnect) * spaceSize -
          spaceSize / 2,
        {
          strokeWidth: 5,
          roughness: 5,
          stroke: `#${COLORS[arg.turn.piece.index]}`,
        }
      );
      break;
  }
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

function hover(e) {
  let padding = spaceSize / 20;
  if (!gameFinished && hasTurn && gameBoard) {
    let squareX = Math.floor((e.clientX - board.offsetLeft) / spaceSize);
    let squareY = Math.floor((e.clientY - board.offsetTop) / spaceSize);
    if (
      squareX >= 0 &&
      squareX < gameSettings.boardWidth &&
      squareY >= 0 &&
      squareY < gameSettings.boardHeight
    ) {
      drawBoard();
      let piecePos = { x: squareX, y: squareY };
      if (gameSettings.hasGravity) {
        piecePos = computeGravity(squareX, squareY);
      }
      DRAWERS[gameSettings.turnPattern[currentTurn].player](
        piecePos.x * spaceSize + padding,
        piecePos.y * spaceSize + padding,
        spaceSize - padding * 2,
        `#${COLORS[gameSettings.turnPattern[currentTurn].piece]}55`,
        canvas
      );
    }
  }
}

function click(e) {
  if (!gameFinished && hasTurn && gameBoard) {
    let squareX = Math.floor((e.clientX - board.offsetLeft) / spaceSize);
    let squareY = Math.floor((e.clientY - board.offsetTop) / spaceSize);
    if (
      squareX >= 0 &&
      squareX < gameSettings.boardWidth &&
      squareY >= 0 &&
      squareY < gameSettings.boardHeight
    ) {
      placeToken(squareX, squareY);
    }
  }
}

/**
 * Determines the position that a token would fall if gravity were applied to it.
 * @param {number} x The X position of the token
 * @param {number} y The Y position of the token
 * @returns The position after applying gravity.
 */
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

/*const ASSET_NAMES = ['circle.svg', 'cross.svg', 'triangle.svg', 'square.svg'];

let assets = {};

const downloadPromise = Promise.all(ASSET_NAMES.map(downloadAsset));

function downloadAsset(assetName) {
  return new Promise(function (resolve) {
    const asset = new Image();
    asset.onload = function () {
      console.log('Downloaded '.concat(assetName));
      assets[assetName] = asset;
      resolve();
    };
    asset.src = '/assets/'.concat(assetName);
  });
}
const downloadAssets = function () {
  return downloadPromise;
};

const getAsset = function (assetName) {
  return assets[assetName];
};
 */
