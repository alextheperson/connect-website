let socketProtocol = window.location.protocol.includes('https') ? 'wss' : 'ws';

const socket = io(
  ''
    .concat(socketProtocol, '://')
    .concat(window.location.host)
    .concat(window.location.pathname.slice(5)),
  {
    reconnection: false,
  }
);

// downloadAssets();

socket.on('connect', () => {
  console.log('connected to server');
  document.getElementById(
    'title'
  ).innerHTML = `Game Code: ${window.location.pathname.slice(6)}`;
});

socket.on('players', (arg) => {
  console.log('players', arg);
  document.getElementById(
    'attendance'
  ).innerHTML = `${arg['current-players']}/${arg['max-players']} players`;
});

socket.on('game-state', (arg) => {
  console.log('game-state', arg);
  gameBoard = arg.board;
  currentTurn = arg.currentTurn;
  hasTurn = gameSettings.turnPattern[arg.currentTurn].player == ownNumber;
  drawBoard();
  drawTurns();
});

socket.on('start-game', (arg) => {
  console.log('start-game', arg);
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');
  ownNumber = arg['own-number'];
  console.log('own number: ', ownNumber);
  gameSettings = arg['settings'];
  initializeGame();
});

socket.on('join-failure', (arg) => {
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
  }
  document.getElementById('error').innerHTML = `<h2>${reason}</h2>`;
});

socket.on('bad-code', () => {
  document.getElementById(
    'error'
  ).innerHTML = `<h2>A game with the code ${window.location.pathname.slice(
    6
  )} does not exist.</h2>`;
});

socket.on('game-end', drawGameEnd);

socket.on('invalid-move', () => console.log('invalid-move'));

function placeToken(x, y) {
  if (!gameFinished && hasTurn) {
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
  transObjs = document.querySelectorAll('.cell.trans');
  transObjs = document.querySelectorAll('.cell-image.trans');
  for (let i = 0; i < transObjs.length; i++) {
    transObjs[i].classList.remove('trans');
  }
}
