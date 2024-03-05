import * as express from 'express';
import { Namespace, Server } from 'socket.io';
import * as multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';

import {
  Game,
  TurnResults,
  type GameSetting,
  EngineSelection,
  Vector,
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

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/home.html'));
});

router.get('/configure', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/configuration.html'));
});

router.get('/game', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/html/enter-code.html'));
});

router.get('/game/:code([0-9]{3})/', (req, res) => {
  let selectedEngine =
    games.get(req.params.code)?.settings.engine ?? 'standard-engine';
  res.sendFile(path.join(__dirname + `/engines/${selectedEngine}/page.html`));
});

router.get('/engine/:engine(*)/:resource(*)', (req, res) => {
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
  // res.sendFile(path.join(__dirname + '/public/html/game.html'));
});

router.get('/tokens/:filename([a-z]+.svg)/:color([0-9a-f]{6})', (req, res) => {
  fs.readFile(
    path.join(__dirname + '/public/assets/tokens/' + req.params.filename),
    'utf8',
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

const io = new Server(server);

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

  // socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
  // socket.on(Constants.MSG_TYPES.INPUT, handleInput);
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
  let sett = new ConfigurationValidator(body).validate();
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
