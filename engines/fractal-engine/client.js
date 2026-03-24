let canvas, boardContainer;
let gameSettings;
let gameBoard;
let spaceSize = 0;
let turnManager;
let gameFinished = false;

/* //==== WebSocket Callbacks ====// */
function handleConnect(arg) {
  console.log('connected to server');
  document.getElementById(
    'title'
  ).innerHTML = `Game Code: ${window.location.pathname.split('/').at(-2)}`;
}

function handlePlayers(arg) {
  console.log("handlePlayers");
  console.dir(arg);
}

function handleGameState(arg) {
  console.log("handleGameState");
  console.dir(arg);

  turnManager.update(arg.currentTurn);

  arg.layers.forEach((value, index) => {
    let board = value.map((row) => row.map((val) => val.map((vbl) => vbl.join(" ")).join("|")).join(" || ")).join("\n\n");
    console.log(`Layer ${index}:\n${board}`)

  });
  console.log(`Current Turn: ${arg.currentTurn}`);
  if (arg.currentFocus === null) {
    console.log("No Focus Yet");
  } else {
    let coords = arg.currentFocus.map((val) => `(${val.x}, ${val.y})`).join(", ");
    console.log(`Focus Coords: ${coords}`);
  }
}

function handleStartGame(arg) {
  console.log("handleStartGame");
  console.dir(arg);
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('error').classList.add('hidden');

  gameSettings = arg['settings'];
  turnManager = new TurnManager('turns', arg['own-number']);

  document.getElementById('game').classList.remove('hidden');
  boardContainer = document.getElementById('board-container');
  canvas = new BoardDisplay('board');
  // canvas._element.addEventListener('mousemove', hover);
  canvas._element.addEventListener('mouseout', () => {
    if (!gameFinished) {
      // drawBoard();
    }
  });
  // canvas._element.addEventListener('click', click);
  layout();
  turnManager.update(0);

  window.addEventListener('resize', handleResize);
} 158

function handleJoinFailure(arg) {
  console.log("handleJoinFailure");
  console.dir(arg);
}

function handleGameEnd(arg) {
  console.log("handleGameEnd");
  console.dir(arg);
}

function handleInvalidMove(arg) {
  console.log("handleInvalidMove");
  console.dir(arg);
}
/* //==== End WebSocket Callbacks ====// */


/* //==== Drawing Functions ====// */

function layout(windowWidth, windowHeight) {

}

function drawBoard(layers) {
  for (let i = 0; i < layers.length; i++) {
    let currentLayer = layers[i];
    for (let j = 0; j < currentLayer.length; j++) {
      let currentRow = currentLayer[j];
      for (let k = 0; k < currentRow.length; k++) {
        let currentBoard = currentRow[k];
        canvas.grid(0, 0, currentBoard[0].length, currentBoard.length);
      }
    }
  }
}

/* //==== End Drawing Functions ====// */

/* //==== Event Handlers ====// */
function handleHover(e) {

}

function handleClick(e) {

}

function handleResize(e) {
  layout()
}

/* //==== End Event Handlers ====// */

function placeToken(x, y) {
  if (!gameFinished && turnManager.hasTurn) {
    socket.emit('place-token', {
      x: x,
      y: y,
    });
  }
}
