import { FractalEngine } from '../engines/fractal-engine/server';
import { GameSetting } from './game';
import { GameEngine } from './game-engine';
import { GravityEngine } from '../engines/gravity-engine/server';
import { StandardEngine } from '../engines/standard-engine/server';

export class GameEngineFactory {
  static getGameEngine(settings: GameSetting): GameEngine {
    switch (settings.engine) {
      case 'standard-engine':
        return new StandardEngine(settings);
      // case 'fractal-engine':
      //   return new FractalEngine(settings);
      // case 'gravity-engine':
      //   return new GravityEngine(settings);
      default:
        return new StandardEngine(settings);
    }
  }
}
