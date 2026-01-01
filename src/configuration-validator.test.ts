import test, { describe } from "node:test";
import { ConfigurationValidator } from "./configuration-validator";
import assert from "assert";

const exampleConfiguration = {
  "number-test": "5",
  "link-test": "3",
  "boolean-test": "true",
  "enum-number-test": "1",
  "enum-string-test": "z",
  "vector-test": "-1,0",
  "pieces-test": "1,1,0,0",
  "turns-test": "0-0,1-1,0-2,1-3",
  "directions-test": "-1,0|1,-1|0,1",
  "enableCorrespondence": "false",
  "turnTime": "0",
  "totalTurnTime": "0",
  "allowSpectators": "false",
  "numPlayers": "3",
  "engine": "standard-engine"
}

const exampleOptions = ConfigurationValidator.parseOptions({
  "$schema": "../engines/options.schema.json",
  "sections": [
    {
      "name": "General",
      "options": [
        {
          "type": "number",
          "name": "number-test",
          "defaultValue": 2,
          "minimum": 0,
          "maximum": 5
        },
        {
          "type": "number",
          "name": "link-test",
          "defaultValue": 2,
          "minimum": ["enum-number-test"],
          "maximum": ["number-test"]
        },
        {
          "type": "boolean",
          "name": "boolean-test",
          "defaultValue": true
        },
        {
          "type": "enum",
          "name": "enum-number-test",
          "defaultValue": 3,
          "multiline": false,
          "options": [
            { "displayName": "a", "value": 1 },
            { "displayName": "b", "value": 2 },
            { "displayName": "c", "value": 3 }
          ]
        },
        {
          "type": "enum",
          "name": "enum-string-test",
          "defaultValue": "y",
          "multiline": true,
          "options": [
            { "displayName": "a", "value": "x" },
            { "displayName": "b", "value": "y" },
            { "displayName": "c", "value": "z" }
          ]
        },
        {
          "type": "vector",
          "name": "vector-test",
          "defaultValue": "-1, 1",

        },
      ]
    },
    {
      "name": "Complex",
      "options": [
        {
          "type": "pieces",
          "name": "pieces-test",
          "defaultValue": "1,1",
          "minimumPieces": 1,
          "maximumPieces": 5,
          "canWinDefault": true
        },
        {
          "type": "turns",
          "name": "turns-test",
          "defaultValue": "0-0,1-1",
          "players": 2,
          "pieces": ["pieces-test"],
          "minimumTurns": 2,
          "maximumTurns": 5
        },
        {
          "type": "directions",
          "name": "directions-test",
          "defaultValue": "1,1|-1,0",
          "minimumTurns": 1,
          "maximumTurns": 5
        }
      ]
    }
  ]
})

const validator = new ConfigurationValidator(exampleOptions);

describe("configuration-validator/ConfigurationValidator", () => {
  test("ConfigurationValidator.parseOptions()", () => {
    const parseOutput = exampleOptions;

    const requiredOptions = ["number-test", "link-test", "boolean-test", "enum-number-test", "enum-string-test", "vector-test", "pieces-test", "turns-test", "directions-test", "enableCorrespondence", "turnTime", "totalTurnTime", "allowSpectators", "numPlayers", "engine"];

    for (let i = 0; i < requiredOptions.length; i++) {
      if (!parseOutput.hasOwnProperty(requiredOptions[i])) {
        assert.fail(`The parse output does not include the option '${requiredOptions[i]}'`)
      }
    }

    Object.keys(parseOutput).forEach((val) => {
      if (!requiredOptions.includes(val)) {
        assert.fail(`The parse output includes extra option '${val}'`)
      }
    })
  });

  test("ConfigurationValidator.parseNumberProperty()", () => {
  });

  describe("ConfigurationValidator.validateNumber()", () => {
    test("Bottom Range", () => {
      validator.loadConfiguration({ "number-test": "0" });
      assert.strictEqual(validator.validateNumber("number-test"), 0);
    })
    test("Top Range", () => {
      validator.loadConfiguration({ "number-test": "5" });
      assert.strictEqual(validator.validateNumber("number-test"), 5);
    })
    test("Below Range", () => {
      validator.loadConfiguration({ "number-test": "-1" });
      assert.throws(() => validator.validateNumber("number-test"));
    })
    test("Above Range", () => {
      validator.loadConfiguration({ "number-test": "6" });
      assert.throws(() => validator.validateNumber("number-test"));
    })
    test("Not Integer", () => {
      validator.loadConfiguration({ "number-test": "1.5" });
      assert.throws(() => validator.validateNumber("number-test"));
    })
    test("Not Number", () => {
      validator.loadConfiguration({ "number-test": "abc" });
      assert.throws(() => validator.validateNumber("number-test"));
    })
  });

  describe("ConfigurationValidator.validateBoolean()", () => {
    test("True", () => {
      validator.loadConfiguration({ "boolean-test": "true" });
      assert.strictEqual(validator.validateBoolean("boolean-test"), true);
    })
    test("False", () => {
      validator.loadConfiguration({ "boolean-test": "false" });
      assert.strictEqual(validator.validateBoolean("boolean-test"), false);
    })
    test("Invalid", () => {
      validator.loadConfiguration({ "boolean-test": "0" });
      assert.throws(() => validator.validateBoolean("boolean-test"));
    })
  });

  describe("ConfigurationValidator.validateEnum()", () => {
    describe("Numerical Values", () => {
      test("Valid", () => {
        validator.loadConfiguration({ "enum-number-test": "1" });
        assert.strictEqual(validator.validateEnum("enum-number-test"), "1"); // Yes, this is intentional, sorry
      })
      test("Invalid", () => {
        validator.loadConfiguration({ "enum-number-test": "hello world" });
        assert.throws(() => validator.validateEnum("enum-number-test"));
      })
    })
    describe("String Values", () => {
      test("Valid", () => {
        validator.loadConfiguration({ "enum-string-test": "z" });
        assert.strictEqual(validator.validateEnum("enum-string-test"), "z");
      })
      test("Invalid", () => {
        validator.loadConfiguration({ "enum-string-test": "hello world" });
        assert.throws(() => validator.validateEnum("enum-string-test"));
      })
    })
  });

  describe("ConfigurationValidator.validateVector()", () => {
    test("Valid", () => {
      validator.loadConfiguration({ "vector-test": "1,0" });
      assert.deepStrictEqual(validator.validateVector("vector-test"), { "x": 1, "y": 0 });
    })
    test("Invalid", () => {
      validator.loadConfiguration({ "vector-test": "badinput" });
      assert.throws(() => validator.validateVector("vector-test"));
    })
  });

  describe("ConfigurationValidator.validatePieces()", () => {
    test("Valid", () => {
      validator.loadConfiguration({ "pieces-test": "1,1,0,0" });
      assert.deepStrictEqual(validator.validatePieces("pieces-test"), [true, true, false, false]);
    })
    test("Invalid", () => {
      validator.loadConfiguration({ "pieces-test": "true, true, nowin, false" });
      assert.throws(() => validator.validatePieces("pieces-test"));
    })
  });

  describe("ConfigurationValidator.validateTurns()", () => {
    test("Valid", () => {
      validator.loadConfiguration({ "turns-test": "0-0,1-1,0-2,1-3" });
      assert.deepStrictEqual(validator.validateTurns("turns-test"), [{ player: 0, piece: 0 }, { player: 1, piece: 1 }, { player: 0, piece: 2 }, { player: 1, piece: 3 }]);
    })
    test("Invalid", () => {
      validator.loadConfiguration({ "turns-test": "0-0-0-0" });
      assert.throws(() => validator.validateTurns("turns-test"));
    })
  });

  describe("ConfigurationValidator.validateDirections()", () => {
    test("Valid", () => {
      validator.loadConfiguration({ "directions-test": "1,1|0,-1|-1,-1" });
      assert.deepStrictEqual(validator.validateDirections("directions-test"), [{ x: 1, y: 1 }, { x: 0, y: -1 }, { x: -1, y: -1 }]);
    })
    test("0,0", () => {
      validator.loadConfiguration({ "directions-test": "1,1|0,-1|0,0" });
      assert.throws(() => validator.validateDirections("directions-test"));
    })
    test("Invalid", () => {
      validator.loadConfiguration({ "directions-test": "abcdefg" });
      assert.throws(() => validator.validateDirections("directions-test"));
    })
  });

  test("ConfigurationValidator.validate()", () => {
    validator.loadConfiguration(exampleConfiguration);

    assert.deepStrictEqual(validator.validate(), {
      "number-test": 5,
      "link-test": 3,
      "boolean-test": true,
      "enum-number-test": "1",
      "enum-string-test": "z",
      "vector-test": { x: -1, y: 0 },
      "pieces-test": [true, true, false, false],
      "turns-test": [{ player: 0, piece: 0 }, { player: 1, piece: 1 }, { player: 0, piece: 2 }, { player: 1, piece: 3 }],
      "directions-test": [{ x: -1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 1 }],
      "enableCorrespondence": false,
      "turnTime": 0,
      "totalTurnTime": 0,
      "allowSpectators": false,
      "numPlayers": 3,
      "engine": "standard-engine"
    })
  });
})
