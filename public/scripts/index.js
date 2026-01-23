let socketProtocol = window.location.protocol.includes('https') ? 'wss' : 'ws';

const socket = io(
  ''
    .concat(socketProtocol, '://')
    .concat(window.location.host)
    .concat('/' + window.location.pathname.split('/').at(-2)),
  {
    reconnection: false,
    path: window.location.pathname
      .split('/')
      .slice(0, -3)
      .join('/')
      .concat('/socket.io/'),
  }
);

socket.on('connect', handleConnect);

socket.on('players', handlePlayers);

socket.on('game-state', handleGameState);

socket.on('start-game', handleStartGame);

socket.on('join-failure', handleJoinFailure);

socket.on('game-end', handleGameEnd);

socket.on('invalid-move', handleInvalidMove);

window.addEventListener("resize", onResize);

onResize()

function onResize(e) {
  let container = document.getElementById("game");
  if (document.body.offsetHeight > document.body.offsetWidth) {
    container.classList.add("column");
    container.classList.remove("row");
  } else {
    container.classList.add("row");
    container.classList.remove("column");
  }
}
