const express = require('express');
import { Namespace, Server } from 'socket.io';
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const upload = multer();

const Constants = require(path.join(
  __dirname + '/public/scripts/constants.js'
));
import {
  Game,
  TurnResults,
  type GameSetting,
  Rulesets,
  Vector,
} from './src/game';
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

app.post('/game', upload.none(), (req, res) => {
  const newId = createNewGame(parseGameSettings(req.body)).id;
  console.log(newId);
  res.send(newId);
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
    if (currentGame.addPlayer(socket.id)) {
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
    }
  });
});

function validateToInt(input: string | undefined, name: string) {
  if (input !== undefined && input.match(/^([1-9][0-9]*)|([0-9])$/)) {
    return parseInt(input);
  } else {
    throw new Error(`'${name}' in not an Integer`);
  }
}

function validateToBool(input: string | undefined, name: string) {
  if (input === undefined || input === 'on') {
    return input === 'on';
  } else {
    throw new Error(`'${name}' in not a Boolean`);
  }
}

function validateToEnum(
  input: string | undefined,
  allowed: string[],
  name: string
) {
  if (input !== undefined && allowed.includes(input)) {
    return input;
  } else {
    throw new Error(
      `'${name}' does not have one of the allowed values: '${allowed.join(
        "', '"
      )}'`
    );
  }
}

function validateToVector(input: string | undefined, name: string) {
  if (input !== undefined && input.match(/[-0-1],[-0-1]/)) {
    let values = input.split(',');
    return {
      x: parseInt(values[0]),
      y: parseInt(values[1]),
    };
  } else {
    throw new Error(`'${name}' does not have the right format (#,#)`);
  }
}

function parseGameSettings(body: Object): GameSetting {
  let width: number,
    height: number,
    numberToConnect: number,
    diagonals: boolean,
    gravity: boolean,
    gravityDirection: Vector,
    numPlayers: number,
    allowSpectators: boolean,
    extraRulesets: Rulesets,
    pieces: boolean[],
    turnPattern: { player: number; piece: number }[];

  if (validateToInt(body['boardWidth'], 'boardWidth') > 2) {
    width = parseInt(body['boardWidth']);
  } else {
    throw new Error("'boardWidth' is less than 2");
  }
  if (validateToInt(body['boardHeight'], 'boardHeight') > 2) {
  } else {
    throw new Error("'boardHeight' is less than 2");
  }
  height = parseInt(body['boardHeight']);
  if (
    validateToInt(body['numToConnect'], 'numToConnect') <=
    Math.max(width, height)
  ) {
    // TODO: Add minimum too
    numberToConnect = parseInt(body['numToConnect']);
  } else {
    throw new Error("'numToConnect' is greater than the size of the board");
  }
  diagonals = validateToBool(body['allowDiagonals'], 'allowDiagonals');
  gravity = validateToBool(body['hasGravity'], 'hasGravity');
  gravityDirection = validateToVector(
    body['gravityDirection'],
    'gravityDirection'
  ) as Vector;
  if (
    validateToInt(body['numPlayers'], 'numPlayers') > 1 &&
    parseInt(body['numPlayers']) <= 5
  ) {
    numPlayers = parseInt(body['numPlayers']);
  } else {
    throw new Error("'numPlayers' out of the range [2:5]");
  }
  allowSpectators = validateToBool(body['allowSpectators'], 'allowSpectators');
  extraRulesets = validateToEnum(
    body['extraRulesets'],
    ['fractal', 'gravity-rotate', 'none'],
    'extraRulesets'
  ) as Rulesets;

  if (body['pieces'] !== undefined && body['pieces'].match(/^[0-1]+$/)) {
    let pieceList = body['pieces'].split('');
    pieceList = pieceList.map((el) => el == 1);
    pieces = pieceList;
  } else {
    throw new Error(
      `'pieces' is not in the right format (it can only contain 0 and 1).`
    );
  }

  if (
    body['turnPattern'] !== undefined &&
    body['turnPattern'].match(/^([0-9]+-[0-9]+,){2,}$/)
  ) {
    let turns = body['turnPattern'].slice(0, -1).split(',');
    turns = turns.map((el) => {
      let split = el.split('-');
      return {
        player: validateToInt(split[0], 'turnPattern'),
        piece: validateToInt(split[1], 'turnPattern'),
      };
    });
    turnPattern = turns;
  } else {
    throw new Error(
      `'turnPattern' is not in the right format (player#-piece#,player#-piece#,).`
    );
  }

  return {
    boardWidth: width,
    boardHeight: height,
    numToConnect: numberToConnect,
    allowDiagonals: diagonals,
    hasGravity: gravity,
    gravityDirection: gravityDirection,
    numPlayers: numPlayers,
    allowSpectators: allowSpectators,
    extraRulesets: extraRulesets,
    pieces: pieces,
    turnPattern: turnPattern,
  };
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
