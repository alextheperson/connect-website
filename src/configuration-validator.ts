import * as GeneralOptions from '../engines/general-options.json'
import * as StandardOptions from '../engines/standard-engine/options.json';
import * as GravityOptions from '../engines/gravity-engine/options.json';
import * as FractalOptions from '../engines/fractal-engine/options.json';
import * as HexagonalOptions from '../engines/hexagonal-engine/options.json';

import {
  EngineSelection,
  GameSetting,
  PieceSet,
  TurnPattern,
  Vector,
} from './game';

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
    value: string | number;
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
  static configurationSets: Record<EngineSelection, OptionSet> = {
    'standard-engine': ConfigurationValidator.parseOptions(StandardOptions),
    'gravity-engine': ConfigurationValidator.parseOptions(GravityOptions),
    'fractal-engine': ConfigurationValidator.parseOptions(FractalOptions),
    'hexagonal-engine': ConfigurationValidator.parseOptions(HexagonalOptions),
  };
  values!: Record<string, string>;
  currentConfiguration: OptionSet;

  constructor(options: OptionSet) {
    this.currentConfiguration = options;
  }

  /**
   * This loads user inputs to then be validated.
   */
  loadConfiguration(values: { [index: string]: string }) {
    this.values = values;
    return this;
  }

  /**
   * Get the option set for an engine, based on its name
   */
  static getEngineOptions(engine: string): OptionSet {
    if (this.configurationSets[engine as EngineSelection] !== undefined) {
      return this.configurationSets[engine as EngineSelection];
    }

    throw new Error(`The engine '${engine} does not exist.'`);
  }

  static parseOptions(config: any) {
    let optionSet: OptionSet = {};

    if (GeneralOptions.sections instanceof Array) {
      GeneralOptions.sections.forEach((val: any) => {
        (val.options ?? []).forEach((option: any) => {
          optionSet = { [option.name ?? '_']: option, ...optionSet };
        });
      });
    }

    if (config.sections instanceof Array) {
      config.sections.forEach((val: any) => {
        (val.options ?? []).forEach((option: any) => {
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
          `The '${propertyName}' property is malformed in option '${optionName}'. Please report this bug.`
        );
      }
    }
  }

  validateNumber(name: string): number {
    if (!Object.keys(this.currentConfiguration).includes(name)) {
      throw new Error(
        `The selected option set does not have an option '${name}'.`
      );
    }

    let value: number;
    try {
      // I assume that I put this in here because it would throw an error, but it doesn't
      value = parseInt(this.values[name]);
    } catch {
      throw new Error(`The option '${name}' is not an Integer.`);
    }

    // This should actually do the behavior that the above statement tries to do
    if (this.values[name].match(/^[0-9]+$/)) {
      value = parseInt(this.values[name])
    } else {
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
        `The selected option set does not have an option '${name}'.`
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
        `The selected option set does not have an option '${name}'.`
      );
    }

    const configOptions = this.currentConfiguration[name];

    if (configOptions.options === undefined) {
      throw new Error(
        `The 'options' property of the ${name} option is missing. Please report this error.`
      );
    }

    if (!(configOptions.options instanceof Array)) {
      throw new Error(
        `The 'options' property of the ${name} option is not an array. Please report this error.`
      );
    }

    if (
      !configOptions.options
        .map((val) => val.value + '')
        .includes(this.values[name] + '')
    ) {
      throw new Error(
        `The value of '${name}' ('${this.values[name]}') is not one of the valid options.`
      );
    }

    return this.values[name];
  }

  validateEngine(name: string): EngineSelection {
    let engine = this.values[name];
    if (ConfigurationValidator.configurationSets[engine as EngineSelection] !== undefined) {
      return engine as EngineSelection;
    }

    throw new Error(`Could not find the engine ${engine}`);
  }

  validateVector(name: string): Vector {
    if (this.values[name].match(/^(1|0|\-1),(1|0|\-1)$/)) {
      return {
        x: parseInt(this.values[name].split(',')[0]) as 1 | 0 | -1,
        y: parseInt(this.values[name].split(',')[1]) as 1 | 0 | -1,
      };
    }
    else {
      throw new Error(`The ${name} option should be a vector (eg. '-1,0', '0,1', etc.)`);
    }
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
    if (this.values[name].match(/^(([0-9]+-[0-9]+),)*([0-9]+-[0-9]+)$/)) {
      return this.values[name].split(',').map((val) => {
        let nums = val.split('-');
        return {
          player: parseInt(nums[0]),
          piece: parseInt(nums[1]),
        };
      });
    } else {
      throw new Error(`The option ${name} does not have the correct format`);
    }
  }

  validateDirections(name: string): Vector[] {
    if (this.values[name].match(/^((1|0|-1),(1|0|-1)\|)*((1|0|-1),(1|0|-1))$/)) {
      return this.values[name].split('|').map((val) => {
        if (val === "0,0") {
          throw new Error(`In option ${name}, the gravity goes to '0,0', which is illegal`)
        }

        return {
          x: parseInt(val.split(',')[0]) as 1 | 0 | -1,
          y: parseInt(val.split(',')[1]) as 1 | 0 | -1,
        };
      });
    } else {
      throw new Error(`The option ${name} does not have the correct format`);
    }
  }

  validate() {
    let parsedSetting: GameSetting = {
      engine: this.validateEngine('engine'),
      numPlayers: this.validateNumber('numPlayers'),
      allowSpectators: this.validateBoolean('allowSpectators'),
    };
    Object.keys(this.currentConfiguration).forEach((val) => {
      const type = this.currentConfiguration[val].type;
      const name = this.currentConfiguration[val].name;

      if (this.values[name] == undefined) {
        throw new Error(`Could not find a value for the option ${name}.`)
      }

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
}
