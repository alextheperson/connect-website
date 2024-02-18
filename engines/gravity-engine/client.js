let rulesList, canvas, boardContainer, sidebar;
let gameSettings;
let loaded = false;
let gameBoard;
let gameFinished = false;
let spaceSize = 0;
let ending;
let turnManager;
let gravityIndex = 0;
let gravitySymbol = {
  '0,-1': '&uarr;',
  '1,-1': '&nearr;',
  '1,0': '&rarr;',
  '1,1': '&searr;',
  '0,1': '&darr;',
  '-1,1': '&swarr;',
  '-1,0': '&larr;',
  '-1,-1': '&nwarr;',
};

let boardShapes = [];

function handleStartGame(arg) {
  console.log('start-game', arg);

  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');

  gameSettings = arg['settings'];
  rulesList = document.getElementById('rules');
  sidebar = document.getElementById('sidebar');
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
  drawGravityDisplay();
  createCells();
  createRulesList();
  turnManager.update(0);

  window.addEventListener('resize', createCells);
}

function drawGravityDisplay() {
  const gravityTimeline = document.getElementById('gravity');
  gravityTimeline.innerHTML = '';
  const gravityIndicator = document.createElement('div');
  gravityIndicator.classList.add('timeline-indicator');
  gravityIndicator.id = 'gravity-indicator';
  gravityTimeline.appendChild(gravityIndicator);

  for (let i = 0; i < gameSettings.gravityPattern.length; i++) {
    const timelineItem = document.createElement('div');
    timelineItem.classList.add('timeline-item');
    const timelineText = document.createElement('span');
    timelineText.innerHTML =
      gravitySymbol[
        gameSettings.gravityPattern[i].x +
          ',' +
          gameSettings.gravityPattern[i].y
      ];
    timelineItem.appendChild(timelineText);
    gravityTimeline.appendChild(timelineItem);
  }
}

function createCells() {
  canvas.width = 1;
  canvas.height = 1;
  const isWide = document.body.offsetHeight < document.body.offsetWidth;
  document.getElementById('game').classList.remove('row', 'column');
  document.getElementById('game').classList.add(isWide ? 'row' : 'column');
  const sidePanelWidth = isWide
    ? sidebar.offsetWidth + 60
    : sidebar.offsetHeight + 60;
  const aspectRatio = gameSettings.boardWidth / gameSettings.boardHeight;
  const areaWidth = boardContainer.offsetWidth;
  const areaHeight = boardContainer.offsetHeight;
  if (isWide) {
    const targetWidth = aspectRatio * areaHeight;
    const targetHeight = areaHeight;
    let scaleOffset = 1;
    if (targetWidth > document.body.offsetWidth - sidePanelWidth) {
      scaleOffset = (document.body.offsetWidth - sidePanelWidth) / targetWidth;
    }
    canvas.width = targetWidth * scaleOffset;
    canvas.height = targetHeight * scaleOffset;
  } else {
    const targetWidth = areaWidth;
    const targetHeight = aspectRatio * areaWidth;
    let scaleOffset = 1;
    if (targetHeight > document.body.offsetHeight - sidePanelWidth) {
      scaleOffset = (document.body.offsetHeight - sidePanelWidth) / targetWidth;
    }
    canvas.width = areaWidth * scaleOffset;
    canvas.height = targetHeight * scaleOffset;
  }

  spaceSize = canvas._element.offsetWidth / gameSettings.boardWidth;

  canvas.grid(
    0,
    0,
    gameSettings.boardWidth,
    gameSettings.boardHeight,
    spaceSize
  );
}

function createRulesList() {
  // rulesList.innerHTML = JSON.stringify(gameSettings, null, 4);
}

function drawBoard() {
  let padding = spaceSize / 20;
  canvas.erase();
  let aspectRatio = gameSettings.boardWidth / gameSettings.boardHeight;
  canvas.width = aspectRatio * canvas._element.offsetHeight;
  canvas.height = canvas._element.offsetHeight;

  spaceSize = canvas._element.width / gameSettings.boardWidth;

  canvas.grid(
    0,
    0,
    gameSettings.boardWidth,
    gameSettings.boardHeight,
    spaceSize
  );
  for (let y = 0; y < gameBoard.length; y++) {
    for (let x = 0; x < gameBoard[0].length; x++) {
      if (gameBoard[y][x] > -1) {
        canvas.DRAWERS[gameSettings.turnPattern[gameBoard[y][x]].player](
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
  document
    .getElementById('gravity-indicator')
    .style.setProperty('--position', gravityIndex);
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
      piecePos = computeGravity(squareX, squareY);

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
 * @param {number} initialX The X position of the token
 * @param {number} initialY The Y position of the token
 * @returns The position after applying gravity.
 */
function computeGravity(initialX, initialY) {
  let dx = gameSettings.gravityPattern[gravityIndex].x;
  let dy = gameSettings.gravityPattern[gravityIndex].y;
  let x = initialX;
  let y = initialY;

  while (x >= 0 && x < gameBoard[0].length && y >= 0 && y < gameBoard.length) {
    const currentSpace = gameBoard[y][x];
    if (currentSpace !== -1) {
      return { x: x - dx, y: y - dy };
    }
    x += dx;
    y += dy;
  }

  return { x: x - dx, y: y - dy };
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
  gravityIndex = arg.gravityIndex;
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
    if (gameSettings.hasGravity) {
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
