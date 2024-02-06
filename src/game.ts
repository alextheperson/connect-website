import { Namespace } from 'socket.io';
import { GameEngine } from './game-engine';
import { GameEngineFactory } from './game-engine-factory';
export type Rulesets = 'fractal' | 'gravity-rotate' | 'none';
export type Vector = {
  x: 0 | 1 | -1;
  y: 0 | 1 | -1;
};
export type GameSetting = {
  boardWidth: number;
  boardHeight: number;
  numToConnect: number;
  allowDiagonals: boolean;
  hasGravity: boolean;
  gravityDirection: Vector;
  numPlayers: number;
  allowSpectators: boolean;
  extraRulesets: Rulesets;
  pieces: boolean[];
  turnPattern: {
    player: number;
    piece: number;
  }[];
};

export enum TurnResults {
  'NORMAL',
  'WIN',
  'DRAW',
}

export type JoinStatus =
  | 'full'
  | 'finished'
  | 'unknown'
  | 'success'
  | 'duplicate'
  | 'spectate';

export class Game {
  id: string;
  settings: GameSetting;
  gameFinished: boolean = false;
  gameEngine: GameEngine;
  players: string[];
  spectators: string[];

  namespace: Namespace;

  constructor(id: string, settings: GameSetting, namespace: Namespace) {
    this.id = id;
    this.settings = settings;
    this.players = [];
    this.spectators = [];
    this.namespace = namespace;
  }

  get numPlayers() {
    return this.players.length;
  }

  hasPlayer(id: string) {
    return this.players.includes(id);
  }

  addPlayer(id: string): JoinStatus {
    if (this.hasPlayer(id)) {
      return 'duplicate';
    }
    if (this.numPlayers >= this.settings.numPlayers) {
      return 'full';
    }
    if (this.gameFinished) {
      return 'finished';
    }
    this.players.push(id);
    if (this.numPlayers === this.settings.numPlayers) {
      this.initializeGame();
    }
    return 'success';
  }

  removePlayer(id: string) {
    if (this.hasPlayer(id)) {
      this.players.splice(this.players.indexOf(id), 1);
    }
  }

  hasSpectator(id: string) {
    return this.spectators.includes(id);
  }

  addSpectator(id: string): JoinStatus {
    if (this.hasSpectator(id)) {
      return 'duplicate';
    }

    if (!this.settings.allowSpectators) {
      return 'spectate';
    }
    if (this.gameFinished) {
      return 'finished';
    }

    this.spectators.push(id);
    this.namespace
      .to(id)
      .emit('start-game', { 'own-number': -1, settings: this.settings });
    this.namespace.to(id).emit('game-state', this.gameEngine.sendGameState());
    return 'success';
  }

  removeSpectator(id: string) {
    if (this.hasSpectator(id)) {
      this.spectators.splice(this.spectators.indexOf(id), 1);
    }
  }

  initializeGame() {
    this.gameEngine = GameEngineFactory.getGameEngine(this.settings);

    for (let i = 0; i < this.players.length; i++) {
      this.namespace
        .to(this.players[i])
        .emit('start-game', { 'own-number': i, settings: this.settings });
    }
    this.namespace.emit('game-state', this.gameEngine.sendGameState());
  }

  placeToken(id: string, x: number, y: number) {
    if (
      // !this.gameFinished ||
      this.players.indexOf(id) !== this.gameEngine.currentPlayer.index ||
      !this.gameEngine.placeToken(x, y, this.gameEngine.currentTurn)
    ) {
      this.namespace.emit('invalid-move');
    }
    let result = this.gameEngine.checkForEnd();
    if (result['outcome'] === TurnResults.WIN) {
      this.namespace.emit('game-end', result);
      this.gameFinished = true;
    } else if (result['outcome'] === TurnResults.DRAW) {
      this.namespace.emit('game-end', result);
      this.gameFinished = true;
    }
    this.namespace.emit('game-state', this.gameEngine.sendGameState());
  }
}
