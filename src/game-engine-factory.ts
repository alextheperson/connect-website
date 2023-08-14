import { FractalEngine } from './fractal-engine';
import { GameSetting } from './game';
import { GameEngine } from './game-engine';
import { GravityEngine } from './gravity-engine';
import { StandardEngine } from './standard-engine';

export class GameEngineFactory {
  static getGameEngine(settings: GameSetting): GameEngine {
    switch (settings.extraRulesets) {
      // case 'fractal':
      //   return new FractalEngine();
      // case 'gravity-rotate':
      //   return new GravityEngine();
      default:
        return new StandardEngine(settings);
    }
  }
}
