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
});

socket.on('settings', (arg) => {
  console.log(arg);
  gameSettings = arg;
  captureDOMReferences();
  createCells();
});

socket.on('players', (arg) => {
  console.log(arg);
});

socket.on('join-failure', () => {
  document.getElementById('board').innerHTML =
    "<h2>Couldn't join the game. It is probably full.</h2>";
});
