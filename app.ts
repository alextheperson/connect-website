const express = require('express');
import { Namespace, Server } from 'socket.io';
const fs = require('fs');
const path = require('path');

const Constants = require(path.join(
  __dirname + '/public/scripts/constants.js'
));
import { Game, turnResults, type GameSetting } from './src/game';
const games: Map<string, Game> = new Map<string, Game>();

// Setup an Express server
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/home.html'));
});

app.get('/configure', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/configuration.html'));
});

app.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/enter-code.html'));
});

app.get('/game/:code([0-9]{9})', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/game.html'));
});

app.post('/game', (req, res) => {
  const newId = createNewGame(parseGameSettings(req.body)).id;
  console.log(newId);
  res.redirect(`/game/${newId}`);
  // res.sendFile(path.join(__dirname + '/public/html/game.html'));
});

app.get('/tokens/:filename([a-z]+.svg)/:color([0-9a-f]{6})', (req, res) => {
  console.log(req.params.color, req.params.filename);
  fs.readFile(
    path.join(__dirname + '/public/assets/tokens/' + req.params.filename),
    'UTF-8',
    (err, data) => {
      if (err) {
        throw err;
      }
      res.type('image/svg+xml');
      res.set('Cache-Control', 'public, max-age=31557600'); // one year
      res.send(data.replace('{{color}}', '#' + req.params.color));
    }
  );
});

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

const io = new Server(server);

const gameNamespaces = io.of(/^\/[0-9]{9}$/);

// Listen for socket.io connections
gameNamespaces.on('connection', (socket) => {
  console.log(`Player (id: ${socket.id}) at the namespace ${socket.nsp.name}`);
  const gameId = socket.nsp.name.slice(1);
  let currentGame = games.get(gameId);
  if (currentGame) {
    if (currentGame.addPlayer(socket.id, socket.nsp)) {
      // socket.emit('join-success');
      socket.nsp.emit('players', {
        'current-players': currentGame.numPlayers,
        'max-players': currentGame.settings.numPlayers,
      });
    } else {
      socket.emit('join-failure');
    }
  } else {
    socket.emit('bad-code');
  }

  // socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  // socket.on(Constants.MSG_TYPES.INPUT, handleInput);
  socket.on('disconnect', () => {
    if (currentGame) {
      currentGame.removePlayer(socket.id);
      cullGames();
    }
    console.log(
      `Player (id: ${socket.id}) disconnected from the ${socket.nsp.name} namespace`
    );
  });

  socket.on('place-token', (arg) => {
    if (currentGame) {
      let result = currentGame.placeToken(socket.id, arg.x, arg.y);
      if (result == 'invalid-move') {
        socket.emit('invalid-move');
      } else if (result['outcome'] == turnResults.WIN) {
        socket.nsp.emit('game-end', result);
      } else if (result['outcome'] == turnResults.DRAW) {
        socket.nsp.emit('game-end', result);
      }
      socket.nsp.emit('game-state', currentGame.gameState);
    }
  });
});

function parseGameSettings(body: Object): GameSetting {
  let width: number,
    height: number,
    numberToConnect: number,
    diagonals: boolean,
    gravity: boolean,
    numPlayers: number,
    fractalized: boolean;
  if (body['width'] !== undefined && body['width'].match(/^[1-9][0-9]*$/)) {
  } else {
    throw new Error("Property 'width' is bad");
  }
  width = parseInt(body['width']);
  if (body['height'] !== undefined && body['height'].match(/^[1-9][0-9]*$/)) {
  } else {
    throw new Error("Property 'height' is bad");
  }
  height = parseInt(body['height']);
  if (
    body['numberToConnect'] !== undefined &&
    body['numberToConnect'].match(/^[1-9][0-9]*$/) &&
    parseInt(body['numberToConnect']) <= Math.max(width, height)
  ) {
  } else {
    throw new Error("Property 'numberToConnect' is bad");
  }
  numberToConnect = parseInt(body['numberToConnect']);
  if (body['diagonals'] === undefined || body['diagonals'] === 'on') {
  } else {
    throw new Error("Property 'diagonals' is bad");
  }
  diagonals = body['diagonals'] === 'on';
  if (body['gravity'] === undefined || body['gravity'] === 'on') {
  } else {
    throw new Error("Property 'gravity' is bad");
  }
  gravity = body['gravity'] === 'on';
  if (
    body['players'] !== undefined &&
    body['players'].match(/^[1-9][0-9]*$/) &&
    parseInt(body['players']) >= 2
  ) {
  } else {
    throw new Error("Property 'players' is bad");
  }
  numPlayers = parseInt(body['players']);
  if (body['fractalized'] === undefined || body['fractalized'] === 'on') {
  } else {
    throw new Error("Property 'fractalized' is bad");
  }
  fractalized = body['fractalized'] === 'on';

  return {
    width: width,
    height: height,
    numberToConnect: numberToConnect,
    diagonals: diagonals,
    gravity: gravity,
    numPlayers: numPlayers,
    fractalized: fractalized,
    turnPattern: [
      {
        player: 0,
        piece: 0,
      },
      {
        player: 1,
        piece: 1,
      },
    ],
  };
}

function createNewGame(settings: GameSetting) {
  const newGame = new Game(newId(), settings);
  games.set(newGame.id, newGame);

  return newGame;
}

function newId() {
  let code;
  do {
    code = '';
    for (let i = 0; i < 9; i++) {
      code += Math.floor(Math.random() * 9);
    }
  } while (
    Array.from(games.keys()).includes(code) ||
    !code.match(/^[0-9]{9}$/) ||
    code.length !== 9
  );

  return code;
}

function cullGames() {
  const gameList = Array.from(games.values());
  for (let i = 0; i < gameList.length; i++) {
    if (gameList[i].numPlayers <= 0) {
      // games.delete(gameList[i].id);
      // console.log(`deleted game ${gameList[i].id} because it had no players`);
    }
  }
}
