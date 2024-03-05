function displayProblemList(gameSettings) {
  let obj = document.getElementById('issues');
  obj.innerHTML = `<legend>Issues</legend>`;

  let issues = generateIssueList(gameSettings);
  if (issues.length <= 0) {
    obj.innerHTML += `<div class="success">No issues detected.</div>`;
    return;
  }
  for (let i = 0; i < issues.length; i++) {
    obj.innerHTML += `<div class="${issues[i].type}">${issues[i].content}</div>`;
  }
}

function generateIssueList(gameSettings) {
  let issues = [];
  issues = issues.concat(
    detectTurnlessPlayers(gameSettings.turns, gameSettings.numPlayers),
    detectPlayersWithNoWinningPieces(
      gameSettings.turns,
      gameSettings.numPlayers,
      gameSettings.pieces
    ),
    detectTurnlessPieces(gameSettings.turns, gameSettings.pieces),
    detectUnevenTurns(gameSettings.turns, gameSettings.numPlayers),
    detectSolvedGames(
      gameSettings.boardWidth,
      gameSettings.boardHeight,
      gameSettings.numToConnect,
      gameSettings.numPlayers,
      gameSettings.hasGravity
    )
  );
  return issues;
}

function detectTurnlessPlayers(turns, numPlayers) {
  let playersWithoutTurns = [...Array(numPlayers).keys()];

  for (let i = 0; i < turns.length; i++) {
    for (let j = 0; j < playersWithoutTurns.length; j++) {
      if (playersWithoutTurns[j] === turns[i].player) {
        playersWithoutTurns.splice(j, 1);
      }
    }
  }

  let issues = [];
  for (let i = 0; i < playersWithoutTurns.length; i++) {
    issues.push({
      type: 'error',
      content: `Player ${
        playersWithoutTurns[i] + 1
      } does not have a turn. You probably want to <b>give them a turn</b> or <b>enable spectators</b>.`,
    });
  }

  return issues;
}

function detectPlayersWithNoWinningPieces(turns, numPlayers, pieces) {
  let playersWithoutWinningPieces = [...Array(numPlayers).keys()];

  for (let i = 0; i < turns.length; i++) {
    for (let j = 0; j < playersWithoutWinningPieces.length; j++) {
      if (pieces[turns[i].piece].canWin) {
        playersWithoutWinningPieces.splice(j, 1);
      }
    }
  }

  let issues = [];
  for (let i = 0; i < playersWithoutWinningPieces.length; i++) {
    issues.push({
      type: 'error',
      content: `Player ${
        playersWithoutWinningPieces[i] + 1
      } does not have a pieces that can win. You likely want to <b>give them a piece that can win</b>.`,
    });
  }

  return issues;
}

function detectTurnlessPieces(turns, pieces) {
  let piecesWithoutTurns = [...Array(pieces.length).keys()];

  for (let i = 0; i < turns.length; i++) {
    for (let j = 0; j < piecesWithoutTurns.length; j++) {
      if (piecesWithoutTurns[j] === turns[i].piece) {
        piecesWithoutTurns.splice(j, 1);
      }
    }
  }

  let issues = [];
  for (let i = 0; i < piecesWithoutTurns.length; i++) {
    issues.push({
      type: 'warning',
      content: `Piece ${
        piecesWithoutTurns[i] + 1
      } never gets played. Perhaps consider <b>removing it</b>?`,
    });
  }

  return issues;
}

function detectUnevenTurns(turns, numPlayers) {
  let numberOfTurns = Array(numPlayers).fill(0);
  for (let i = 0; i < turns.length; i++) {
    numberOfTurns[turns[i].player] += 1;
  }
  for (let i = 0; i < numberOfTurns.length; i++) {
    if (numberOfTurns[i] !== numberOfTurns[0]) {
      let turnString = '';
      for (let j = 0; j < numberOfTurns.length; j++) {
        turnString += `Player ${j} has ${numberOfTurns[j]} turn${
          numberOfTurns[j] === 1 ? '' : 's'
        }${j < numberOfTurns.length - 2 ? ', ' : ''}${
          j === numberOfTurns.length - 2 ? ', and ' : ''
        }`;
      }
      return [
        {
          type: 'warning',
          content: `Not all players have the same number of turns. ${turnString}.`,
        },
      ];
    }
  }
  return [];
}

function detectSolvedGames(
  boardWidth,
  boardHeight,
  numToConnect,
  numPlayers,
  hasGravity
) {
  if (numPlayers === 2 && !hasGravity) {
    let winString = [
      {
        type: 'message',
        content: `The 𝑚,𝑛,𝑘-game (${boardWidth},${boardHeight},${numToConnect}). Has been <a href="https://en.wikipedia.org/wiki/M,n,k-game#General_results">proven</a> to end in a <b>win</b>, assuming perfect play.`,
      },
    ];
    let drawString = [
      {
        type: 'message',
        content: `The 𝑚,𝑛,𝑘-game (${boardWidth},${boardHeight},${numToConnect}). Has been <a href="https://en.wikipedia.org/wiki/M,n,k-game#General_results">proven</a> to end in a <b>draw</b>, assuming perfect play.`,
      },
    ];
    if (numToConnect > boardWidth && numToConnect > boardHeight) {
      return [
        {
          type: 'message',
          content: `The 𝑚,𝑛,𝑘-game (${boardWidth},${boardHeight},${numToConnect}) is trivially impossible to win.`,
        },
      ];
    }
    if (numToConnect < 3) {
      return [
        {
          type: 'message',
          content: `The 𝑚,𝑛,𝑘-game (${boardWidth},${boardHeight},${numToConnect}) is a trivial win.`,
        },
      ];
    }
    if (numToConnect >= 9) {
      return drawString;
    }
    if (
      numToConnect >= 3 &&
      (numToConnect > boardWidth || numToConnect > boardHeight)
    ) {
      return drawString;
    }
    if (numToConnect === 3 && boardWidth <= 3 && boardHeight <= 3) {
      return drawString;
    }
    if (
      numToConnect === 3 &&
      ((boardWidth >= 4 && boardHeight >= 3) ||
        (boardWidth >= 3 && boardHeight >= 4))
    ) {
      return winString;
    }
    if (numToConnect === 4 && boardWidth <= 5 && boardHeight <= 5) {
      return drawString;
    }
    if (
      numToConnect === 4 &&
      ((boardWidth >= 6 && boardHeight >= 5) ||
        (boardWidth >= 5 && boardHeight === 6))
    ) {
      return winString;
    }
    if (
      numToConnect === 4 &&
      ((boardWidth <= 8 && boardHeight === 4) ||
        (boardWidth === 4 && boardHeight <= 8))
    ) {
      return drawString;
    }
    if (
      numToConnect === 4 &&
      ((boardWidth >= 30 && boardHeight === 4) ||
        (boardWidth === 4 && boardHeight >= 30))
    ) {
      return winString;
    }
    if (numToConnect === 5 && boardWidth <= 8 && boardHeight <= 8) {
      return drawString;
    }
    if (numToConnect === 5 && boardWidth === 15 && boardHeight === 15) {
      return winString.concat([
        {
          type: 'warning',
          content: `Gomoku, (the 𝑚,𝑛,𝑘-game (15,15,5)) has been shown to give the first player a very large advantage.`,
        },
      ]);
    }
    if (
      numToConnect === 6 &&
      ((boardWidth === 9 && boardHeight === 6) ||
        (boardWidth === 6 && boardHeight === 9))
    ) {
      return drawString;
    }
    if (numToConnect === 6 && boardWidth === 7 && boardHeight === 7) {
      return drawString;
    }
  }
  return [];
}
