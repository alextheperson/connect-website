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
  gameBoard = arg.board;
  currentTurn = arg.currentTurn;
  hasTurn = gameSettings.turnPattern[arg.currentTurn].player == ownNumber;
  drawBoard();
  drawTurns();
  console.log('game-state', arg);
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

socket.on('join-failure', () => {
  document.getElementById('error').innerHTML =
    "<h2>Couldn't join the game. It is probably full.</h2>";
});

socket.on('bad-code', () => {
  document.getElementById(
    'error'
  ).innerHTML = `<h2>A game with the code ${window.location.pathname.slice(
    6
  )} does not exist.</h2>`;
});

socket.on('game-end', drawGameEnd);

function placeToken(x, y) {
  if (hasTurn) {
    if (gameSettings.hasGravity && gameBoard[0][x] === -1) {
      for (let i = 0; i < gameBoard.length; i++) {
        if (gameBoard[i + 1] === undefined || gameBoard[i + 1][x] > -1) {
          socket.emit('place-token', {
            x: x,
            y: i,
          });
          console.log({
            x: x,
            y: i,
          });
          break;
        }
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
