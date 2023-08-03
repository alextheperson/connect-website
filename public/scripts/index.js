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
  console.log(arg);
  document.getElementById(
    'attendance'
  ).innerHTML = `${arg['current-players']}/${arg['max-players']} players`;
});

socket.on('game-state', (arg) => {
  hasTurn = gameSettings['turnPattern'][arg.currentTurn]['player'] == ownNumber;
  drawBoard(arg.board);
  drawTurns(arg.currentTurn);
  console.log('game-state', arg);
});

socket.on('start-game', (arg) => {
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
    socket.emit('place-token', {
      x: x,
      y: y,
    });
  }
}
