class TurnManager {
  /**
   * @type {number}
   */
  _turnNumber = 0;
  /**
   * @type {number}
   */
  _ownNumber;
  /**
   * @type {HTMLElement}
   */
  _element;
  /**
   * @type {{player: number, piece: number}[]}
   */
  _turnPattern;

  constructor(id, ownNumber) {
    this._ownNumber = ownNumber;

    this._turnPattern = gameSettings.turnPattern;

    this._element = document.getElementById(id);

    this._element.innerHTML =
      '<div id="turn-indicator" class="timeline-indicator"></div>';
    for (let i = 0; i < this._turnPattern.length; i++) {
      let { player, piece } = this._turnPattern[i];
      let tokenOwned = player == ownNumber;
      let canWin = gameSettings.pieces[piece];
      // <div class="turn-indicator hidden" id="turn-${i}"></div>
      this._element.innerHTML += `<div id="turn-${i}" class="timeline-item${
        tokenOwned ? ' owned' : ''
      }${canWin ? '' : ' no-win'}" title="${
        tokenOwned ? 'You' : 'Other players'
      } can ${
        canWin ? '' : 'not '
      }use this token to win."><img src="../../tokens/${SHAPES[player]}.svg/${
        COLORS[piece]
      }" /></div>`;
    }
  }

  update(turnNumber) {
    this._turnNumber = turnNumber;
    document
      .getElementById('turn-indicator')
      .style.setProperty('--position', turnNumber);
  }

  get hasTurn() {
    return this._turnPattern[this._turnNumber].player === this.ownNumber;
  }

  get currentTurn() {
    return this._turnNumber;
  }

  get ownNumber() {
    return this._ownNumber;
  }

  getPieceOf(i) {
    return this._turnPattern[i % this._turnPattern.length].piece;
  }

  getPlayerOf(i) {
    console.log();
    return this._turnPattern[i % this._turnPattern.length].player;
  }

  get currentPiece() {
    return this.getPieceOf(this.currentTurn);
  }

  get currentPlayer() {
    return this.getPlayerOf(this.currentTurn);
  }

  get nextPiece() {
    return this.getPieceOf(this.currentTurn + 1);
  }

  get nextPlayer() {
    return this.getPlayerOf(this.currentTurn + 1);
  }

  get previousPiece() {
    return this.getPieceOf(this.currentTurn - 1);
  }

  get previousPlayer() {
    return this.getPlayerOf(this.currentTurn - 1);
  }
}
