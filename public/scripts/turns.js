class TurnManager {
  _turnNumber = 0;
  _ownNumber;
  _element;

  constructor(id, ownNumber) {
    this._ownNumber = ownNumber;
    this._element = document.getElementById(id);

    this._element.innerHTML = '';
    for (let i = 0; i < gameSettings.turnPattern.length; i++) {
      let { player, piece } = gameSettings.turnPattern[i];
      let tokenOwned = player == ownNumber;
      let canWin = gameSettings.pieces[piece];
      // <div class="turn-indicator hidden" id="turn-${i}"></div>
      this._element.innerHTML += `<div id="turn-${i}" class="current-turn turn${
        tokenOwned ? ' owned' : ''
      }${canWin ? '' : ' no-win'}" title="${
        tokenOwned ? 'You' : 'Other players'
      } can ${canWin ? '' : 'not '}use this token to win."><img src="/tokens/${
        SHAPES[player]
      }.svg/${COLORS[piece]}" /></div>`;
    }
  }

  update(turnNumber) {
    this._turnNumber = turnNumber;
    Array.from(document.getElementsByClassName('turn')).map((el) =>
      el.classList.remove('current-turn')
    );
    document
      .getElementById(`turn-${this.currentTurn}`)
      .classList.add('current-turn');
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
