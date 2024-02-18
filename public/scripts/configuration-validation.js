// let pieces = [{ canWin: true }, { canWin: true }];

// let turns = [
//   { player: 0, piece: 0 },
//   { player: 1, piece: 1 },
// ];

// let savedPieces = localStorage.getItem('pieces');
// if (savedPieces !== null) {
//   pieces = JSON.parse(savedPieces);
// }

// let savedTurns = localStorage.getItem('turns');
// if (savedTurns !== null) {
//   turns = JSON.parse(savedTurns);
// }

// let numPlayers;

// document.getElementById('numPlayers').addEventListener('input', () => {
//   numPlayers = parseInt(document.getElementById('numPlayers').value);
//   drawTables();
// });

// document.getElementById('boardWidth').addEventListener('input', () => {
//   document.getElementById('numToConnect').max = Math.max(
//     document.getElementById('boardWidth').value,
//     document.getElementById('boardHeight').value
//   );
//   displayProblemList({
//     numPlayers: numPlayers,
//     turns: turns,
//     pieces: pieces,
//     boardHeight: parseInt(document.getElementById('boardHeight').value),
//     boardWidth: parseInt(document.getElementById('boardWidth').value),
//     numToConnect: parseInt(document.getElementById('numToConnect').value),
//     hasGravity: document.getElementById('hasGravity').checked,
//   });
// });

// document.getElementById('boardHeight').addEventListener('input', () => {
//   document.getElementById('numToConnect').max = Math.max(
//     document.getElementById('boardWidth').value,
//     document.getElementById('boardHeight').value
//   );
//   displayProblemList({
//     numPlayers: numPlayers,
//     turns: turns,
//     pieces: pieces,
//     boardHeight: parseInt(document.getElementById('boardHeight').value),
//     boardWidth: parseInt(document.getElementById('boardWidth').value),
//     numToConnect: parseInt(document.getElementById('numToConnect').value),
//     hasGravity: document.getElementById('hasGravity').checked,
//   });
// });

// document.getElementById('numToConnect').addEventListener('input', () => {
//   displayProblemList({
//     numPlayers: numPlayers,
//     turns: turns,
//     pieces: pieces,
//     boardHeight: parseInt(document.getElementById('boardHeight').value),
//     boardWidth: parseInt(document.getElementById('boardWidth').value),
//     numToConnect: parseInt(document.getElementById('numToConnect').value),
//     hasGravity: document.getElementById('hasGravity').checked,
//   });
// });

// document.getElementById('form').addEventListener('submit', (e) => {
//   const formData = new FormData(document.getElementById('form'));

//   piecesText = '';
//   for (let i = 0; i < pieces.length; i++) {
//     piecesText += pieces[i].canWin ? '1' : '0';
//   }
//   formData.append('pieces', piecesText);

//   turnPattern = '';
//   for (let i = 0; i < turns.length; i++) {
//     turnPattern += `${turns[i].player}-${turns[i].piece},`;
//   }
//   formData.append('turnPattern', turnPattern);
//   const request = new XMLHttpRequest();
//   request.onreadystatechange = function () {
//     if (this.readyState == 4 && this.status == 200) {
//       window.location.pathname = `/game/${this.responseText}/`;
//     }
//   };
//   request.open('POST', 'game');
//   request.send(formData);
//   e.preventDefault();
// });

// function createPieceRow(index, canWin) {
//   return `<tr><td><code style="color: #${COLORS[index]}">${
//     index + 1
//   }.</code></td><td><input type="checkbox" style="accent-color: #${
//     COLORS[index]
//   }" oninput="changePieceCanWin(${index},this.checked)"${
//     canWin ? ' checked' : ''
//   } /></td><td><input ${
//     index < 1 ? 'disabled ' : ''
//   }type="button" onclick="removePiece(${index})" value="⤫" /></td></tr>`;
// }

// function createPlayerRow(index) {
//   let playerOptions = '';
//   for (let i = 0; i < numPlayers; i++) {
//     turns[index].player = Math.min(turns[index].player, numPlayers - 1);
//     playerOptions += `<option value="${i}"${
//       i == turns[index].player ? ' selected="selected" ' : ''
//     }>${SYMBOLS[i]}</option>`;
//   }
//   let pieceOptions = '';
//   for (let i = 0; i < pieces.length; i++) {
//     turns[index].piece = Math.min(turns[index].piece, pieces.length - 1);
//     pieceOptions += `<option value="${i}"${
//       i == turns[index].piece ? ' selected="selected" ' : ''
//     }>${i + 1}</option>`;
//   }
//   return `<tr><td><code>${index + 1}.</code></td><td><select style="color: #${
//     COLORS[turns[index].piece]
//   }" oninput="changeTurnPlayer(${index},this.value)">${playerOptions}</select></td><td><select oninput="changeTurnPiece(${index},this.value)" style="color: #${
//     COLORS[turns[index].piece]
//   }">${pieceOptions}</select></td><td><input ${
//     index < numPlayers ? 'disabled ' : ''
//   }type="button" onclick="removeTurn(${index})" value="⤫" /></td></tr>`;
// }

// function addPiece() {
//   if (pieces.length < COLORS.length) {
//     pieces.push({
//       canWin: true,
//     });
//     drawTables();
//   }
// }

// function addTurn() {
//   turns.push({
//     player: 0,
//     piece: 0,
//   });
//   drawTables();
// }

// function removePiece(index) {
//   if (pieces.length > 1) {
//     pieces.splice(index, 1);
//     drawTables();
//   }
// }

// function removeTurn(index) {
//   turns.splice(index, 1);
//   drawTables();
// }

// function changePieceCanWin(index, changeTo) {
//   pieces[index].canWin = changeTo;
//   drawTables();
// }
// function changeTurnPiece(index, changeTo) {
//   turns[index].piece = changeTo;
//   drawTables();
// }
// function changeTurnPlayer(index, changeTo) {
//   turns[index].player = changeTo;
//   drawTables();
// }

// function drawTables() {
//   localStorage.setItem('pieces', JSON.stringify(pieces));
//   localStorage.setItem('turns', JSON.stringify(turns));
//   document.getElementById('pieces').innerHTML = '';
//   for (let i = 0; i < pieces.length; i++) {
//     document.getElementById('pieces').innerHTML += createPieceRow(
//       i,
//       pieces[i].canWin
//     );
//   }
//   document.getElementById('turns').innerHTML = '';
//   for (let i = 0; i < turns.length; i++) {
//     document.getElementById('turns').innerHTML += createPlayerRow(
//       i,
//       turns[i].player,
//       turns[i].piece
//     );
//   }

//   displayProblemList({
//     numPlayers: numPlayers,
//     turns: turns,
//     pieces: pieces,
//     boardHeight: parseInt(document.getElementById('boardHeight').value),
//     boardWidth: parseInt(document.getElementById('boardWidth').value),
//     numToConnect: parseInt(document.getElementById('numToConnect').value),
//     hasGravity: document.getElementById('hasGravity').checked,
//   });
// }

// numPlayers = parseInt(document.getElementById('numPlayers').value);
// drawTables();

function load(currentEngine) {
  inputs = {};
  sectionIds.forEach((id) => {
    document.getElementById(id).remove();
  });
  sectionIds = [];

  parseSections([
    {
      name: 'General',
      options: [
        {
          name: 'engine',
          label: undefined,
          type: 'enum',
          defaultValue: currentEngine,
          options: [
            { value: 'standard-engine', displayName: 'Standard Engine' },
            { value: 'gravity-engine', displayName: 'Gravity Engine' },
            // { value: 'fractal-engine', displayName: 'Fractal Engine' },
          ],
        },
      ],
    },
  ]);

  inputs['engine'].subscribe((val) => {
    const req = new XMLHttpRequest();
    req.addEventListener('load', (req) => {
      load(val);

      parseSections(JSON.parse(req.target.response).sections);
    });
    req.open('GET', `engine/${val}/options.json`);
    req.send();
  });
}

load('standard-engine');

initConfig();

document.getElementById('form').addEventListener('submit', (e) => {
  const formData = new FormData(document.getElementById('form'));

  Object.values(inputs).forEach((val) => {
    formData.append(val._name, val.value);
  });

  console.log(formData);
  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      window.location.pathname = `/game/${this.responseText}/`;
    }
  };
  request.open('POST', 'game');
  request.send(formData);

  console.log(formData);
  e.preventDefault();
});
