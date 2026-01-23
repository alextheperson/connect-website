class TurnManager {
  _turnNumber = 0;
  _ownNumber;
  _element;
  _indicator;

  constructor(id, ownNumber) {
    this._ownNumber = ownNumber;
    this._element = document.getElementById(id);

    this._element.innerHTML =
      '<div id="turn-indicator" class="timeline-indicator"></div>';
    for (let i = 0; i < gameSettings.turnPattern.length; i++) {
      let { player, piece } = gameSettings.turnPattern[i];
      let tokenOwned = player == ownNumber;
      let canWin = gameSettings.pieces[piece];
      // <div class="turn-indicator hidden" id="turn-${i}"></div>
      this._element.innerHTML += `<div id="turn-${i}" class="timeline-item${tokenOwned ? ' owned' : ''
        }${canWin ? '' : ' no-win'}" title="${tokenOwned ? 'You' : 'Other players'
        } can ${canWin ? '' : 'not '
        }use this token to win."><img src="../../tokens/${SHAPES[player]}.svg/${COLORS[piece]
        }" /></div>`;
    }
    this._indicator = document.getElementById('turn-indicator');
  }

  update(turnNumber) {
    this._turnNumber = turnNumber;
    this._indicator.style.setProperty('--position', turnNumber);

    this._indicator.style.width = `${this._element.children[1].offsetWidth}px`;
    this._indicator.style.setProperty('--step-size', `calc(${this._element.children[1].offsetWidth}px + var(--padding))`);
    console.log("Set width to", this._element.children[1].offsetHeight)
  }

  get hasTurn() {
    return gameSettings.turnPattern[this._turnNumber].player === this.ownNumber;
  }

  get currentTurn() {
    return this._turnNumber;
  }

  get ownNumber() {
    return this._ownNumber;
  }
}
