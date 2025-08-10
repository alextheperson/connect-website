let rulesList, canvas, boardContainer;
let gameSettings;
let loaded = false;
let gameBoard;
let gameFinished = false;
let spaceSize = 0;
let ending;
let turnManager;

let boardShapes = [];

function handleStartGame(arg) {
  console.log('start-game', arg);

  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');

  gameSettings = arg['settings'];
  rulesList = document.getElementById('rules');
  turnManager = new TurnManager('turns', arg['own-number']);

  document.getElementById('game').classList.remove('hidden');
  boardContainer = document.getElementById('board-container');
  canvas = new BoardDisplay('board');
  // canvas.rectangle(10, 10, 200, 200); // x, y, width, height
  canvas._element.addEventListener('mousemove', hover);
  canvas._element.addEventListener('mouseout', () => {
    if (!gameFinished) {
      drawBoard();
    }
  });
  canvas._element.addEventListener('click', click);
  createRulesList();
  turnManager.update(0);

  window.addEventListener('resize', drawBoard);
}

function sizeCanvas() {
  const windowAspectRatio =
    document.body.offsetWidth / document.body.offsetHeight;
  const boardAspectRatio = gameSettings.boardWidth / gameSettings.boardHeight;

  document.getElementById('game').classList.remove('row', 'column');
  document
    .getElementById('game')
    .classList.add(boardAspectRatio < windowAspectRatio ? 'row' : 'column');

  canvas._element.style.aspectRatio = `${gameSettings.boardWidth} / ${gameSettings.boardHeight}`;

  const areaWidth = boardContainer.offsetWidth;
  const areaHeight = boardContainer.offsetHeight;

  const horizontalScale = areaWidth / boardAspectRatio;
  const verticalScale = areaHeight;
  canvas.width = boardAspectRatio * Math.min(horizontalScale, verticalScale);
  canvas.height = Math.min(horizontalScale, verticalScale);

  spaceSize = Math.min(
    canvas._element.offsetWidth / gameSettings.boardWidth,
    canvas._element.offsetHeight / gameSettings.boardHeight
  );
}

function createRulesList() {
  // rulesList.innerHTML = JSON.stringify(gameSettings, null, 4);
}

function drawBoard() {
  sizeCanvas();
  let padding = spaceSize / 20;

  canvas.grid(
    0,
    0,
    gameSettings.boardWidth,
    gameSettings.boardHeight,
    spaceSize
  );
  for (let y = 0; y < gameBoard.length; y++) {
    for (let x = 0; x < gameBoard[0].length; x++) {
      if (gameBoard[y][x] !== null) {
        canvas.DRAWERS[gameBoard[y][x].player.index](
          x * spaceSize + padding,
          y * spaceSize + padding,
          spaceSize - padding * 2,
          `#${COLORS[gameBoard[y][x].piece.index]}`,
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
  if (arg['outcome'] === 2) {
    document.getElementById('result').innerHTML = 'DRAW';
  } else {
    let startPos = arg.lines.at(0).cells[0].coords;
    let endPos = arg.lines.at(-1).cells[0].coords;
    canvas.line(
      startPos[0] * spaceSize,
      startPos[1] * spaceSize + spaceSize / 2,
      endPos[0] * spaceSize,
      endPos[1] + spaceSize / 2,
      {
        strokeWidth: 5,
        roughness: 5,
        stroke: `#${COLORS[arg.turn.piece.index]}`,
      }
    );
    document.getElementById(
      'result'
    ).innerHTML = `<img class="cell-image" src="../../tokens/${
      SHAPES[arg.player.index]
    }.svg/ffffff"/> <span>Wins!</span>
    `;
  }
}

function hover(e) {
  let padding = spaceSize / 20;
  if (!gameFinished && turnManager.hasTurn && !!gameBoard) {
    let squareX = Math.floor(
      (e.clientX - canvas._element.offsetLeft) / spaceSize
    );
    let squareY = Math.floor(
      (e.clientY - canvas._element.offsetTop) / spaceSize
    );

    if (
      squareX >= 0 &&
      squareX < gameSettings.boardWidth &&
      squareY >= 0 &&
      squareY < gameSettings.boardHeight
    ) {
      drawBoard();
      let piecePos = { x: squareX, y: squareY };
      if (gameSettings.doGravity) {
        piecePos = computeGravity(squareX, squareY);
      }

      canvas.rectangle(
        squareX * spaceSize,
        squareY * spaceSize,
        spaceSize,
        spaceSize,
        {
          fill: '#030303',
          stroke: '#00000000',
        }
      );

      canvas.DRAWERS[gameSettings.turnPattern[turnManager.currentTurn].player](
        piecePos.x * spaceSize + padding,
        piecePos.y * spaceSize + padding,
        spaceSize - padding * 2,
        `#${COLORS[gameSettings.turnPattern[turnManager.currentTurn].piece]}88`,
        canvas
      );
    }
  }
}

function click(e) {
  if (!gameFinished && turnManager.hasTurn && gameBoard) {
    let squareX = Math.floor(
      (e.clientX - canvas._element.offsetLeft) / spaceSize
    );
    let squareY = Math.floor(
      (e.clientY - canvas._element.offsetTop) / spaceSize
    );
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
  let { gravityAngle } = gameSettings;
  let localX = x;
  if (gravityAngle.x === 1) {
    localX = 0;
  } else if (gravityAngle.x === -1) {
    localX = gameSettings.boardWidth - 1;
  }
  let localY = y;
  if (gravityAngle.y === 1) {
    localY = 0;
  } else if (gravityAngle.y === -1) {
    localY = gameSettings.boardHeight - 1;
  }

  if (gravityAngle.x !== 0 && gravityAngle.y !== 0) {
    let delta = Math.min(Math.abs(x - localX), Math.abs(y - localY));
    localX = x + delta * -gravityAngle.x;
    localY = y + delta * -gravityAngle.y;
  }
  if (gameBoard[localY][localX] === -1) {
    for (
      let i = 0;
      i < Math.ceil(gameBoard.length ** 2 + (gameBoard[1].length ** 2) ** 0.5); // Length of the diagonal
      i++
    ) {
      if (
        gameBoard[(i + 1) * gravityAngle.y + localY] === undefined ||
        gameBoard[(i + 1) * gravityAngle.y + localY][
          (i + 1) * gravityAngle.x + localX
        ] === undefined ||
        gameBoard[(i + 1) * gravityAngle.y + localY][
          (i + 1) * gravityAngle.x + localX
        ] > -1
      ) {
        return {
          x: i * gravityAngle.x + localX,
          y: i * gravityAngle.y + localY,
        };
      }
    }
  }
  return null;
}

function handleConnect(arg) {
  console.log('connected to server');
  document.getElementById(
    'title'
  ).innerHTML = `Game Code: ${window.location.pathname.split('/').at(-2)}`;
}

function handlePlayers(arg) {
  console.log('players', arg);
  document.getElementById(
    'attendance'
  ).innerHTML = `${arg['current-players']}/${arg['max-players']} players`;
}

function handleGameState(arg) {
  console.log('game-state', arg);
  gameBoard = arg.board;
  drawBoard();
  turnManager.update(arg.currentTurn);
}
function handleJoinFailure(arg) {
  console.log('join-failure', arg);
  let reason = "Couldn't join the game.";
  if (arg.reason == 'full') {
    reason = 'That game is full.';
  } else if (arg.reason == 'finished') {
    reason = 'That game has already ended.';
  } else if (arg.reason == 'duplicate') {
    reason = 'You have already joined this game.';
  } else if (arg.reason == 'spectate') {
    reason = 'Spectators are not allowed in this game.';
  } else if (arg.reason == 'badCode') {
    reason = `Could not find a game with the code '${window.location.pathname
      .split('/')
      .at(-2)}'.`;
  }
  document.getElementById('error').innerHTML = `<h2>${reason}</h2>`;
}

function handleGameEnd(arg) {
  drawGameEnd(arg);
}

function handleInvalidMove(arg) {
  console.log('invalid-move');
}

function placeToken(x, y) {
  if (!gameFinished && turnManager.hasTurn) {
    if (gameSettings.doGravity) {
      let gravity = computeGravity(x, y);
      if (gravity !== null) {
        socket.emit('place-token', {
          x: gravity.x,
          y: gravity.y,
        });
        console.log({
          x: gravity.x,
          y: gravity.y,
        });
      }
    } else {
      socket.emit('place-token', {
        x: x,
        y: y,
      });
    }
  }
}
