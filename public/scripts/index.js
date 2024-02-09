let socketProtocol = window.location.protocol.includes('https') ? 'wss' : 'ws';

const socket = io(
  ''
    .concat(socketProtocol, '://')
    .concat(window.location.host)
    .concat('/' + window.location.pathname.split('/').at(-2)),
  {
    reconnection: false,
  }
);

socket.on('connect', handleConnect);

socket.on('players', handlePlayers);

socket.on('game-state', handleGameState);

socket.on('start-game', handleStartGame);

socket.on('join-failure', handleJoinFailure);

socket.on('game-end', handleGameEnd);

socket.on('invalid-move', handleInvalidMove);
