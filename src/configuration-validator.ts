import * as fs from 'fs';
import * as path from 'path';
import * as StandardOption from '../engines/standard-engine/options.json';
import * as GravityOption from '../engines/gravity-engine/options.json';
import {
  EngineSelection,
  GameSetting,
  PieceSet,
  TurnPattern,
  Vector,
} from './game';
import { Piece } from './game-engine';

export type OptionType =
  | 'number'
  | 'boolean'
  | 'enum'
  | 'vector'
  | 'pieces'
  | 'turns'
  | 'directions';

export interface Option {
  [index: string]: string | number | boolean | object;
  type: OptionType;
  name: string;
  label: string;
}

export interface NumberOption extends Option {
  type: 'number';
  minimum: number | string[];
  maximum: number | string[];
}

export interface BooleanOption extends Option {
  type: 'boolean';
}

export interface EnumOption extends Option {
  type: 'enum';
  options: {
    value: string;
    displayName: string;
  }[];
}

export interface VectorOption extends Option {
  type: 'vector';
}

export interface PiecesOption extends Option {
  type: 'pieces';
  minimumPieces: number | string[];
  maximumPieces: number | string[];
}

export interface TurnsOption extends Option {
  type: 'turns';
  minimumTurns: number | string[];
  maximumTurns: number | string[];
  players: number | string[];
  pieces: number | string[];
}

export interface DirectionsOption extends Option {
  type: 'directions';
  minimumTurns: number | string[];
  maximumTurns: number | string[];
}

export type OptionSet = { [index: string]: Option };

export class ConfigurationValidator {
  configurationSets: Record<EngineSelection, OptionSet> = {
    'standard-engine': this.parseOptions(StandardOption),
    'gravity-engine': this.parseOptions(GravityOption),
  };
  values: Record<string, string>;
  currentEngine: EngineSelection;
  currentConfiguration: OptionSet;

  constructor(values: { [index: string]: string }) {
    this.values = values;
  }

  parseOptions(config: any) {
    let optionSet: OptionSet = {};
    if (config.sections instanceof Array) {
      config.sections.forEach((val) => {
        (val.options ?? []).forEach((option) => {
          optionSet = { [option.name ?? '_']: option, ...optionSet };
        });
      });
    }
    return optionSet;
  }
  /**
   * Evaluates a property that could be a list of references. If it is an array, it will apply the `coalesce` function to it (with spread) to get a single result.
   * @param value The value to parse
   * @param coalesce The function to apply to the results in order to get a single number (eg. `Math.min()`)
   * @param optionName The name of the option that this property is a part of
   * @param propertyName The name of the property
   * @returns
   */
  parseNumberProperty(
    value: any,
    coalesce: (...values: number[]) => number,
    optionName: string,
    propertyName: string
  ) {
    if (value !== undefined) {
      if (value instanceof Array) {
        return coalesce(...value.map((name) => this.validateNumber(name)));
      } else if (typeof value === 'number') {
        return value;
      } else {
        throw new Error(
          `The '${propertyName}' property is malformed in option '${optionName}' of engine '${this.currentEngine}'. Please report this bug.`
        );
      }
    }
  }

  validateNumber(name: string): number {
    if (!Object.keys(this.currentConfiguration).includes(name)) {
      throw new Error(
        `The selected engine ('${this.currentEngine}') does not have an option '${name}'.`
      );
    }

    let value: number;
    try {
      value = parseInt(this.values[name]);
    } catch {
      throw new Error(`The option '${name}' is not an Integer.`);
    }

    const configOptions = this.currentConfiguration[name];

    let minimum =
      this.parseNumberProperty(
        configOptions.minimum,
        Math.max,
        'minimum',
        name
      ) ?? -Infinity;

    let maximum =
      this.parseNumberProperty(
        configOptions.maximum,
        Math.min,
        'maximum',
        name
      ) ?? Infinity;

    if (value < minimum) {
      throw new Error(
        `The option '${name}' is too small (minimum: '${minimum}')`
      );
    }

    if (value > maximum) {
      throw new Error(
        `The option '${name}' is too big (maximum: '${minimum}')`
      );
    }

    return value;
  }

  validateBoolean(name: string): boolean {
    if (!Object.keys(this.currentConfiguration).includes(name)) {
      throw new Error(
        `The selected engine ('${this.currentEngine}') does not have an option '${name}'.`
      );
    }

    if (this.values[name] === 'true') {
      return true;
    } else if (this.values[name] === 'false') {
      return false;
    }

    throw new Error(`The option '${name}' was not a Boolean (true/false)`);
  }

  validateEnum(name: string): string {
    if (!Object.keys(this.currentConfiguration).includes(name)) {
      throw new Error(
        `The selected engine ('${this.currentEngine}') does not have an option '${name}'.`
      );
    }

    const configOptions = this.currentConfiguration[name];

    if (configOptions.options === undefined) {
      throw new Error(
        `The 'options' property of the ${name} option of the engine '${this.currentEngine}' is missing. Please report this error.`
      );
    }

    if (!(configOptions.options instanceof Array)) {
      throw new Error(
        `The 'options' property of the ${name} option of the engine '${this.currentEngine}' is not an array. Please report the error.`
      );
    }

    if (
      !configOptions.options
        .map((val) => val.value + '')
        .includes(this.values[name] + '')
    ) {
      throw new Error(
        `The value of '${name}' is not one of the valid options.`
      );
    }

    return this.values[name];
  }

  validateVector(name: string): Vector {
    return {
      x: parseInt(this.values[name].split(',')[0]) as 1 | 0 | -1,
      y: parseInt(this.values[name].split(',')[1]) as 1 | 0 | -1,
    };
  }

  validatePieces(name: string): PieceSet {
    return this.values[name].split(',').map((val) => {
      if (val === '1') {
        return true;
      } else if (val === '0') {
        return false;
      } else {
        throw new Error(
          `The '${name}' option does not have the correct format`
        );
      }
    });
  }

  validateTurns(name: string): TurnPattern {
    return this.values[name].split(',').map((val) => {
      let nums = val.split('-');
      return {
        player: parseInt(nums[0]),
        piece: parseInt(nums[1]),
      };
    });
  }

  validateDirections(name: string): Vector[] {
    return this.values[name].split('|').map((val) => {
      return {
        x: parseInt(val.split(',')[0]) as 1 | 0 | -1,
        y: parseInt(val.split(',')[1]) as 1 | 0 | -1,
      };
    });
  }

  validate() {
    if (
      this.values.engine !== undefined &&
      this.configurationSets[this.values.engine] !== undefined
    ) {
      this.currentEngine = this.values.engine as EngineSelection;
      this.currentConfiguration = this.configurationSets[this.currentEngine];
      let parsedSetting: GameSetting = {
        engine: this.currentEngine,
        numPlayers: this.validateNumber('numPlayers'),
        allowSpectators: this.validateBoolean('allowSpectators'),
      };
      Object.keys(this.currentConfiguration).forEach((val) => {
        const type = this.currentConfiguration[val].type;
        const name = this.currentConfiguration[val].name;
        switch (type) {
          case 'number':
            parsedSetting = {
              [name]: this.validateNumber(name),
              ...parsedSetting,
            };
            break;
          case 'boolean':
            parsedSetting = {
              [name]: this.validateBoolean(name),
              ...parsedSetting,
            };
            break;
          case 'enum':
            parsedSetting = {
              [name]: this.validateEnum(name),
              ...parsedSetting,
            };
            break;
          case 'vector':
            parsedSetting = {
              [name]: this.validateVector(name),
              ...parsedSetting,
            };
            break;
          case 'pieces':
            parsedSetting = {
              [name]: this.validatePieces(name),
              ...parsedSetting,
            };
            break;
          case 'turns':
            parsedSetting = {
              [name]: this.validateTurns(name),
              ...parsedSetting,
            };
            break;
          case 'directions':
            parsedSetting = {
              [name]: this.validateDirections(name),
              ...parsedSetting,
            };
            break;
          default:
            throw new Error(
              `The option '${name}' has an invalid type: '${type}'`
            );
        }
      });
      return parsedSetting;
    }
    throw new Error(`The engine '${this.values.engine} does not exist.'`);
  }
}
