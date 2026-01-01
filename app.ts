import express = require('express');
import { Server } from 'socket.io';
import multer = require('multer');
import fs = require('fs')
import path = require('path');

import {
  Game,
  type GameSetting,
} from './src/game';
import { ConfigurationValidator } from './src/configuration-validator';

const upload = multer();

const Constants = require(path.join(
  __dirname + '/public/scripts/constants.js'
));
const games: Map<string, Game> = new Map<string, Game>();

// Setup an Express server
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

const router = express.Router();

router.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/home.html'));
});

router.get('/configure', (_req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/configuration.html'));
});

router.get('/game', (_req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/enter-code.html'));
});

router.get('/game/:code/', (req, res) => {
  if (!req.params.code.match(/^[0-9]{3}$/)) {
    res.status(400)
    res.send("The game code is malformed. It should be a three digit numerical code (/[0-9]{3}/)")
  }

  let selectedEngine =
    games.get(req.params.code)?.settings.engine ?? 'standard-engine';

  fs.readFile(
    path.join(__dirname + '/public/html/game.html'),
    'utf-8',
    (err, data) => {
      if (err) {
        throw err;
      }
      res.type('text/html');
      res.send(data.replace('{{selected-engine}}', selectedEngine));
    }
  );
});

router.get('/config/:resource', (req, res) => {
  res.sendFile(
    path.join(__dirname + `/engines/${req.params.resource}`)
  );
})

router.get('/engine/:engine/:resource', (req, res) => {
  let selectedEngine = req.params.engine ?? 'standard-engine';
  if (['server.ts', 'server.js'].includes(req.params.resource)) {
    res.status(400);
    res.send(
      `The requested resource (${req.params.resource}) could not be accessed at the requested engine (${selectedEngine}).`
    );
    return;
  }
  res.sendFile(
    path.join(__dirname + `/engines/${selectedEngine}/${req.params.resource}`)
  );
});

router.post('/game', upload.none(), (req, res) => {
  const newId = createNewGame(parseGameSettings(req.body)).id;
  res.send(newId);
});

router.get('/tokens/:filename/:color', (req, res) => {
  if (!req.params.filename.match(/^[a-z]+\.svg$/) || !req.params.color.match(/^[0-9a-f]{6}$/)) {
    res.status(400)
    res.send("The url parameters are malformed. It should be a filename (/[a-z]+\.svg/) and a hex code (/[0-9a-f]{6}/)")
  }

  fs.readFile(
    path.join(__dirname + '/public/assets/tokens/' + req.params.filename),
    'utf-8',
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

app.use(process.env.BASE_URL ?? '/', router);

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

const io = new Server(server, {
  path: path.join(process.env.BASE_URL ?? '/', '/socket.io/'),
});
console.log(
  `Socket.io initialized at '${path.join(
    process.env.BASE_URL ?? '/',
    '/socket.io/'
  )}'`
);

const gameNamespaces = io.of(/^\/[0-9]{3}$/);

// Listen for socket.io connections
gameNamespaces.on('connection', (socket) => {
  console.log(`Player (id: ${socket.id}) at the namespace ${socket.nsp.name}`);
  const gameId = socket.nsp.name.slice(1);
  let currentGame = games.get(gameId);
  if (currentGame) {
    let joinStatus;
    if ((joinStatus = currentGame.addPlayer(socket.id)) === 'success') {
      socket.nsp.emit('players', {
        'current-players': currentGame.numPlayers,
        'max-players': currentGame.settings.numPlayers,
      });
    } else if (
      currentGame.settings.allowSpectators &&
      (joinStatus = currentGame.addSpectator(socket.id)) === 'success'
    ) {
      socket.nsp.emit('players', {
        'current-players': currentGame.numPlayers,
        'max-players': currentGame.settings.numPlayers,
      });
    } else {
      socket.emit('join-failure', { reason: joinStatus });
    }
  } else {
    socket.emit('join-failure', { reason: 'badCode' });
  }

  socket.on('disconnect', () => {
    if (currentGame) {
      if (currentGame.hasPlayer(socket.id)) {
        currentGame.removePlayer(socket.id);
      } else if (currentGame.hasSpectator(socket.id)) {
        currentGame.removeSpectator(socket.id);
      }
      cullGames();
    }
    console.log(
      `Player (id: ${socket.id}) disconnected from the ${socket.nsp.name} namespace`
    );
  });

  socket.on('place-token', (arg) => {
    if (currentGame) {
      let result = currentGame.placeToken(socket.id, arg.x, arg.y);
    }
  });
});

function parseGameSettings(body: any) {
  let engine = body["engine"];
  let validator = new ConfigurationValidator(ConfigurationValidator.getEngineOptions(engine));
  let sett = validator.loadConfiguration(body).validate();
  return sett;
}

function createNewGame(settings: GameSetting) {
  let id = newId();
  const newGame = new Game(id, settings, io.of(`/${id}`));
  games.set(newGame.id, newGame);

  return newGame;
}

function newId() {
  let code;
  do {
    code = '';
    for (let i = 0; i < 3; i++) {
      code += Math.floor(Math.random() * 9);
    }
  } while (
    Array.from(games.keys()).includes(code) ||
    !code.match(/^[0-9]{3}$/) ||
    code.length !== 3
  );

  return code;
}

function cullGames() {
  const gameList = Array.from(games.values());
  for (let i = 0; i < gameList.length; i++) {
    if (gameList[i].numPlayers <= 0) {
      games.delete(gameList[i].id);
      console.log(`deleted game ${gameList[i].id} because it had no players`);
    }
  }
}
