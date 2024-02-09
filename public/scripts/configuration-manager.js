// types: 'number', 'boolean', 'enum', 'vector', 'pieces', 'turns'

class createNumberInput {
  _name;
  _label;
  _defaultValue;
  _minimum;
  _maximum;

  constructor(name, label, defaultValue, minimum, maximum) {
    this._name = name;
    this._label = label;
    this._defaultValue = defaultValue;
    this._minimum = minimum;
    this._maximum = maximum;
  }

  get value() {
    let rawValue = document.getElementById(`${this._name}-input`).innerHTML;
    if (rawValue.match(/[1-9][0-9]*/)) {
      return parseInt(rawValue);
    }
    return this._defaultValue;
  }
}

class createBooleanInput {
  _name;
  _label;
  _defaultValue;

  constructor(name, label, defaultValue) {
    this._name = name;
    this._label = label;
    this._defaultValue = defaultValue;
  }
}

class createEnumInput {
  _name;
  _label;
  _defaultValue;
  _options;

  constructor(name, label, defaultValue, options) {
    this._name = name;
    this._label = label;
    this._defaultValue = defaultValue;
    this._options = options;
  }
}

class createVectorInput {
  _xName;
  _yName;
  _label;
  _separator;
  _defaultX;
  _minimumX;
  _maximumX;
  _defaultY;
  _minimumY;
  _maximumY;

  constructor(
    xName,
    yName,
    label,
    separator,
    defaultX,
    minimumX,
    maximumX,
    defaultY,
    minimumY,
    maximumY
  ) {
    this._xName = xName;
    this._yName = yName;
    this._label = label;
    this._separator = separator;
    this._defaultX = defaultX;
    this._minimumX = minimumX;
    this._maximumX = maximumX;
    this._defaultY = defaultY;
    this._minimumY = minimumY;
    this._maximumY = maximumY;
  }
}

class createPiecesInput {
  _name;
  _label;
  _defaultValue;
  _minimumPieces;
  _maximumPieces;
  _canWinDefault;

  constructor(
    name,
    label,
    defaultValue,
    minimumPieces,
    maximumPieces,
    canWinDefault
  ) {
    this._name = name;
    this._label = label;
    this._defaultValue = defaultValue;
    this._minimumPieces = minimumPieces;
    this._maximumPieces = maximumPieces;
    this._canWinDefault = canWinDefault;
  }
}

class createTurnsInput {
  _name;
  _label;
  _defaultValue;
  _minimumTurns;
  _maximumTurns;

  constructor(name, label, defaultValue, minimumTurns, maximumTurns) {
    this._name = name;
    this._label = label;
    this._defaultValue = defaultValue;
    this._minimumTurns = minimumTurns;
    this._maximumTurns = maximumTurns;
  }
}
