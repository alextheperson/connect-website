export type GameSetting = {
  width: number;
  height: number;
  numberToConnect: number;
  diagonals: boolean;
  gravity: boolean;
  numPlayers: number;
  fractalized: boolean;
  turnPattern: {
    player: number;
    piece: number;
  }[];
};

export class Game {
  id: string;
  settings: GameSetting;
  board: number[][];
  currentPlayer: number;
  currentPiece: number;
  players: string[] = [];

  constructor(id: string, settings: GameSetting) {
    this.id = id;
    this.settings = settings;

    this.board = Array(this.settings.height).fill(
      Array(this.settings.width).fill(-1)
    );
  }

  get numPlayers() {
    return this.players.length;
  }

  hasPlayer(id: string) {
    return this.players.includes(id);
  }

  addPlayer(id: string) {
    if (
      this.numPlayers < this.settings.numPlayers &&
      !this.players.includes(id)
    ) {
      this.players.push(id);
      return true;
    }
    return false;
  }

  removePlayer(id: string) {
    if (this.players.includes(id)) {
      this.players.splice(this.players.indexOf(id), 1);
    }
  }
}
