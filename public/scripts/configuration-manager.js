// types: 'number', 'boolean', 'enum', 'vector', 'pieces', 'turns'

class TextInput {
  _input;

  _listeners = [];

  constructor(name, label, defaultValue, placeholder, parent) {
    this._input = document.createElement('input');
    this._input.id = name;
    this._input.value = defaultValue ?? '';
    this._input.placeholder = placeholder ?? '';
    this._input.addEventListener('input', () => {
      this.update();
    });

    parent.appendChild(this._input);

    if (label !== undefined) {
      const labelElement = document.createElement('label');
      labelElement.id = `${name}-label`;
      labelElement.innerHTML = label;
      labelElement.htmlFor = name;

      parent.appendChild(labelElement);
    }
  }

  update() {
    this._listeners.forEach((cb) => {
      cb(this.value);
    });
  }

  /**
   * Add a function to the called when the value changes.
   * @param {(val: number) => void} cb The callback to call when the value changes.
   */
  subscribe(cb) {
    this._listeners.push(cb);
  }

  get value() {
    let rawValue = this._input.value;
    return rawValue;
  }

  set value(val) {
    this._input.value = val + '';
    this.update();
  }

  get placeholder() {
    return this._input.placeholder;
  }

  set placeholder(val) {
    this._input.placeholder = val + '';
  }

  static parseConfig(config, parent) {
    const placeholder =
      typeof config.placeholder === 'string' ? config.placeholder : undefined;

    const input = new TextInput(
      config.name,
      config.label,
      config.defaultValue,
      placeholder,
      parent
    );

    if (typeof config.placeholder === 'object') {
      getInput(config.placeholder[0]).subscribe((val) => {
        getInput(config.name).placeholder = val.value;
      });
    }

    addInput(config.name, input);
  }
}
class NumberInput {
  _defaultValue;
  _minimum;
  _maximum;

  _input;

  _listeners = [];

  constructor(name, label, defaultValue, minimum, maximum, parent) {
    this._defaultValue = defaultValue;
    this._minimum = minimum;
    this._maximum = maximum;

    this._input = document.createElement('input');
    this._input.id = name;
    this._input.type = 'number';
    this._input.step = 1;
    this._input.value = defaultValue;
    if (minimum !== undefined) {
      this._input.min = minimum;
    }
    if (maximum !== undefined) {
      this._input.max = maximum;
    }
    this._input.addEventListener('input', () => {
      this.update();
    });

    this.value = this._defaultValue;

    parent.appendChild(this._input);

    if (label === undefined) {
      return;
    }

    const labelElement = document.createElement('label');
    labelElement.id = `${name}-label`;
    labelElement.innerHTML = label;
    labelElement.htmlFor = name;

    parent.appendChild(labelElement);
  }

  update() {
    this._listeners.forEach((cb) => {
      cb(this.value);
    });
  }

  /**
   * Add a function to the called when the value changes.
   * @param {(val: number) => void} cb The callback to call when the value changes.
   */
  subscribe(cb) {
    this._listeners.push(cb);
  }

  get value() {
    let rawValue = this._input.value;
    if (rawValue.match(/^[1-9][0-9]*$/) !== null) {
      return parseInt(rawValue);
    }
    return this._defaultValue;
  }

  set value(val) {
    this._input.value = Math.min(Math.max(val, this.minimum), this.maximum);
    this.update();
  }

  get minimum() {
    return this._minimum ?? -Infinity;
  }

  set minimum(val) {
    this._input.min = val;
    this._minimum = val;
  }

  get maximum() {
    return this._maximum ?? Infinity;
  }

  set maximum(val) {
    this._input.max = val;
    this._maximum = val;
  }

  static parseConfig(config, parent) {
    const minimum =
      typeof config.minimum === 'number' ? config.minimum : undefined;
    const maximum =
      typeof config.maximum === 'number' ? config.maximum : undefined;
    const input = new NumberInput(
      config.name,
      config.label,
      config.defaultValue,
      minimum,
      maximum,
      parent
    );

    if (typeof config.minimum === 'object') {
      for (let i = 0; i < config.minimum.length; i++) {
        getInput(config.minimum[i]).subscribe((val) => {
          let minimumValue = getInput(config.minimum[0]).value;
          for (let i = 1; i < config.minimum.length; i++) {
            minimumValue = Math.min(
              minimumValue,
              getInput(config.minimum[i]).value
            );
          }
          getInput(config.name).minimum = minimumValue;
        });
      }
    }

    if (typeof config.maximum === 'object') {
      for (let i = 0; i < config.maximum.length; i++) {
        getInput(config.maximum[i]).subscribe((val) => {
          let maximumValue = getInput(config.maximum[0]).value;
          for (let i = 1; i < config.maximum.length; i++) {
            maximumValue = Math.max(
              maximumValue,
              getInput(config.maximum[i]).value
            );
          }
          getInput(config.name).maximum = maximumValue;
        });
      }
    }

    addInput(config.name, input);
  }
}

class BooleanInput {
  _defaultValue;

  _input;

  _listeners = [];

  constructor(name, label, defaultValue, parent) {
    this._defaultValue = defaultValue;

    this._input = document.createElement('input');
    this._input.id = name;
    this._input.type = 'checkbox';
    this._input.addEventListener('input', () => {
      this.update();
    });

    this.value = this._defaultValue;

    parent.appendChild(this._input);

    if (label === undefined) {
      return;
    }
    const labelElement = document.createElement('label');
    labelElement.id = `${name}-label`;
    labelElement.innerHTML = label;
    labelElement.htmlFor = name;

    parent.appendChild(labelElement);
  }

  update() {
    this._listeners.forEach((cb) => {
      cb(this.value);
    });
  }

  /**
   * Add a function to the called when the value changes.
   * @param {(val: boolean) => void} cb The callback to call when the value changes.
   */
  subscribe(cb) {
    this._listeners.push(cb);
  }

  get value() {
    let rawValue = this._input.checked;
    if (rawValue !== undefined) {
      return rawValue;
    }
    return this._defaultValue;
  }

  set value(val) {
    this._input.checked = val;
    this.update();
  }

  static parseConfig(config, parent) {
    const input = new BooleanInput(
      config.name,
      config.label,
      config.defaultValue,

      parent
    );

    addInput(config.name, input);
  }
}

class EnumInput {
  _defaultValue;
  _options;

  _input;

  _listeners = [];

  constructor(name, label, defaultValue, multiline, options, parent) {
    this._defaultValue = defaultValue;
    this._options = options;

    this._input = document.createElement('select');
    this._input.id = name;
    this.drawOptions();
    this._input.addEventListener('input', () => {
      this.update();
    });

    this.value = this._defaultValue;

    if (!multiline) {
      parent.appendChild(this._input);
    }

    if (label !== undefined) {
      const labelElement = document.createElement('label');
      labelElement.id = `${name}-label`;
      labelElement.innerHTML = label;
      labelElement.htmlFor = name;

      parent.appendChild(labelElement);
    }

    if (multiline) {
      parent.appendChild(document.createElement('br'));
      parent.appendChild(this._input);
    }
  }

  update() {
    this._listeners.forEach((cb) => {
      cb(this.value);
    });
  }

  /**
   * Add a function to the called when the value changes.
   * @param {(val: string) => void} cb The callback to call when the value changes.
   */
  subscribe(cb) {
    this._listeners.push(cb);
  }

  drawOptions() {
    this._input.innerHTML = '';
    for (let i = 0; i < this._options.length; i++) {
      let option = document.createElement('option');
      option.innerHTML = this._options[i].displayName;
      option.value = this._options[i].value;
      if (this._options[i].value === this.value) {
        option.selected = true;
      }
      this._input.appendChild(option);
    }
  }

  get value() {
    let rawValue = this._input.value;
    if (this.options.map((val) => val.value + '').includes(rawValue + '')) {
      return rawValue;
    }
    return this._defaultValue;
  }

  set value(val) {
    this._input.value = val;
    this.update();
  }

  get options() {
    return this._options;
  }

  set options(val) {
    this._options = val;
    this.drawOptions();
    if (!this.options.map((val) => val.value).includes(this.value)) {
      this.value = this._defaultValue;
    }
  }

  static parseConfig(config, parent) {
    const input = new EnumInput(
      config.name,
      config.label,
      config.defaultValue,
      config.multiline,
      config.options,
      parent
    );

    addInput(config.name, input);
  }
}

class VectorInput extends EnumInput {
  constructor(name, label, defaultValue, parent) {
    super(
      name,
      label,
      defaultValue,
      false,
      [
        { value: '0,-1', displayName: '&uarr;' },
        { value: '1,-1', displayName: '&nwarr;' },
        { value: '1,0', displayName: '&rarr;' },
        { value: '1,1', displayName: '&swarr;' },
        { value: '0,1', displayName: '&darr;' },
        { value: '-1,1', displayName: '&searr;' },
        { value: '-1,0', displayName: '&larr;' },
        { value: '-1,-1', displayName: '&nearr;' },
      ],
      parent
    );
    console.log(this.value);
  }

  static parseConfig(config, parent) {
    const input = new VectorInput(
      config.name,
      config.label,
      config.defaultValue,
      parent
    );

    addInput(config.name, input);
  }
}

class PiecesInput {
  _defaultValue;
  _minimumPieces;
  _maximumPieces;
  _canWinDefault;

  _tbody;
  _rowValues = [];

  _listeners = [];

  constructor(
    name,
    label,
    defaultValue,
    minimumPieces,
    maximumPieces,
    canWinDefault,
    parent
  ) {
    this._defaultValue = defaultValue;
    this._minimumPieces = minimumPieces;
    this._maximumPieces = maximumPieces;
    this._canWinDefault = canWinDefault;

    this._rowValues = defaultValue
      .split(',')
      .map((val) => (val === '1' ? true : false));

    const table = document.createElement('table');
    table.id = name;

    const header = document.createElement('thead');
    const headerRow1 = document.createElement('tr');
    const title = document.createElement('th');
    title.innerHTML = label;
    title.colSpan = 3;
    headerRow1.appendChild(title);
    header.appendChild(headerRow1);
    const headerRow2 = document.createElement('tr');
    const headerLabel1 = document.createElement('th');
    headerLabel1.innerHTML = '#';
    headerRow2.appendChild(headerLabel1);
    const headerLabel2 = document.createElement('th');
    headerLabel2.innerHTML = 'Can Win?';
    headerLabel2.colSpan = 2;
    headerRow2.appendChild(headerLabel2);
    header.appendChild(headerRow2);
    table.appendChild(header);

    this._tbody = document.createElement('tbody');
    table.appendChild(this._tbody);

    this.drawRows();

    const footer = document.createElement('tfoot');
    const footerRow = document.createElement('tr');
    const footerCell = document.createElement('td');
    footerCell.colSpan = 3;
    const rowButton = document.createElement('input');
    rowButton.type = 'button';
    rowButton.value = '+ Add Piece';
    rowButton.addEventListener('click', () => this.addRow());
    footerCell.appendChild(rowButton);
    footerRow.appendChild(footerCell);
    footer.appendChild(footerRow);
    table.appendChild(footer);

    parent.appendChild(table);
  }

  update() {
    this._listeners.forEach((cb) => {
      cb(this.value);
    });
  }

  drawRow(index, canWin, canDelete) {
    const row = document.createElement('tr');
    const numberCell = document.createElement('td');
    const number = document.createElement('code');
    number.style.color = '#' + COLORS[index];
    number.innerHTML = `${index + 1}.`;
    numberCell.appendChild(number);
    row.appendChild(numberCell);

    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = canWin;
    checkbox.style.accentColor = '#' + COLORS[index];
    checkbox.addEventListener('change', (e) => {
      this.setCanWin(index, e.target.checked);
    });
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    const deleteButtonCell = document.createElement('td');
    const deleteButton = document.createElement('input');
    deleteButton.type = 'button';
    deleteButton.value = '⤫';
    deleteButton.disabled = !canDelete;
    deleteButton.addEventListener('click', () => {
      this.deleteRow(index);
    });
    deleteButtonCell.appendChild(deleteButton);
    row.appendChild(deleteButtonCell);

    return row;
  }

  drawRows() {
    this._tbody.innerHTML = '';
    for (let i = 0; i < this._rowValues.length; i++) {
      this._tbody.appendChild(
        this.drawRow(i, this._rowValues[i], i >= this.minimumPieces)
      );
    }

    this.update();
  }

  addRow() {
    if (this._rowValues.length >= this.maximumPieces) {
      return;
    }

    this._rowValues.push(this.canWinDefault);
    this.drawRows();
  }

  deleteRow(index) {
    this._rowValues.splice(index, 1);
    this.drawRows();
  }

  setCanWin(index, value) {
    this._rowValues[index] = value;
    this.drawRows();
  }

  /**
   * Add a function to the called when the value changes.
   * @param {(val: string) => void} cb The callback to call when the value changes.
   */
  subscribe(cb) {
    this._listeners.push(cb);
  }

  get value() {
    let rawValue = this._rowValues.map((val) => (val ? 1 : 0)).join(',');
    return rawValue;
  }

  set value(val) {
    if (val.match(/^([0-1],)*[0-1]$/) !== null) {
      this._rowValues = val
        .split(',')
        .map((v) => (v === '1' ? true : false))
        .slice(0, this.maximumPieces);
      this.drawRows();
    }
    this.update();
  }

  get minimumPieces() {
    return this._minimumPieces ?? -Infinity;
  }

  set minimumPieces(val) {
    this._minimumPieces = val;
    while (this._rowValues.length < this._minimumPieces) {
      this._rowValues.push(this._rowValues.at(-1));
    }
    this.drawRows();
  }

  get maximumPieces() {
    return this._maximumPieces ?? Infinity;
  }

  set maximumPieces(val) {
    this._maximumPieces = val;

    this._rowValues = this._rowValues.slice(
      0,
      Math.min(this._maximumPieces, this._rowValues.length)
    );

    this.drawRows();
  }

  get canWinDefault() {
    return this._canWinDefault ?? Infinity;
  }

  set canWinDefault(val) {
    this._canWinDefault = val;
  }

  static parseConfig(config, parent) {
    const minimumPieces =
      typeof config.minimumPieces === 'number'
        ? config.minimumPieces
        : undefined;
    const maximumPieces =
      typeof config.maximumPieces === 'number'
        ? config.maximumPieces
        : undefined;
    const canWinDefault =
      typeof config.canWinDefault === 'boolean'
        ? config.canWinDefault
        : undefined;

    const input = new PiecesInput(
      config.name,
      config.label,
      config.defaultValue,
      minimumPieces,
      maximumPieces,
      canWinDefault,
      parent
    );

    if (typeof config.minimumPieces === 'object') {
      for (let i = 0; i < config.minimumPieces.length; i++) {
        getInput(config.minimumPieces[i]).subscribe((val) => {
          let minimumValue = getInput(config.minimumPieces[0]).value;
          for (let i = 1; i < config.minimumPieces.length; i++) {
            minimumValue = Math.min(
              minimumValue,
              getInput(config.minimumPieces[i]).value
            );
          }
          getInput(config.name).minimum = minimumValue;
        });
      }
    }

    if (typeof config.maximumPieces === 'object') {
      for (let i = 0; i < config.maximumPieces.length; i++) {
        getInput(config.maximumPieces[i]).subscribe((val) => {
          let maximumValue = getInput(config.maximumPieces[0]).value;
          for (let i = 1; i < config.maximumPieces.length; i++) {
            maximumValue = Math.max(
              maximumValue,
              getInput(config.maximumPieces[i]).value
            );
          }
          getInput(config.name).maximum = maximumValue;
        });
      }
    }

    if (typeof config.canWinDefault === 'object') {
      getInput(config.canWinDefault[0]).subscribe((val) => {
        getInput(config.name).canWinDefault = val;
      });
    }

    addInput(config.name, input);
  }
}

class TurnsInput {
  _defaultValue;
  _players;
  _pieces;
  _minimumTurns;
  _maximumTurns;

  _tbody;
  _rowValues = [];

  _listeners = [];

  constructor(
    name,
    label,
    defaultValue,
    players,
    pieces,
    minimumTurns,
    maximumTurns,
    parent
  ) {
    this._defaultValue = defaultValue;
    this._players = players;
    this._pieces = pieces;
    this._minimumTurns = minimumTurns;
    this._maximumTurns = maximumTurns;
    this._rowValues = defaultValue.split(',').map((val) => ({
      player: parseInt(val.split('-')[0]),
      piece: parseInt(val.split('-')[1]),
    }));

    const table = document.createElement('table');
    table.id = name;

    const header = document.createElement('thead');
    const headerRow1 = document.createElement('tr');
    const title = document.createElement('th');
    title.innerHTML = label;
    title.colSpan = 4;
    headerRow1.appendChild(title);
    header.appendChild(headerRow1);
    const headerRow2 = document.createElement('tr');
    const headerLabel1 = document.createElement('th');
    headerLabel1.innerHTML = '#';
    headerRow2.appendChild(headerLabel1);
    const headerLabel2 = document.createElement('th');
    headerLabel2.innerHTML = 'Player';
    headerRow2.appendChild(headerLabel2);
    const headerLabel3 = document.createElement('th');
    headerLabel3.innerHTML = 'Piece';
    headerLabel3.colSpan = 2;
    headerRow2.appendChild(headerLabel3);
    header.appendChild(headerRow2);
    table.appendChild(header);

    this._tbody = document.createElement('tbody');
    table.appendChild(this._tbody);

    this.drawRows();

    const footer = document.createElement('tfoot');
    const footerRow = document.createElement('tr');
    const footerCell = document.createElement('td');
    footerCell.colSpan = 4;
    const rowButton = document.createElement('input');
    rowButton.type = 'button';
    rowButton.value = '+ Add Turn';
    rowButton.addEventListener('click', () => this.addRow());
    footerCell.appendChild(rowButton);
    footerRow.appendChild(footerCell);
    footer.appendChild(footerRow);
    table.appendChild(footer);

    parent.appendChild(table);
  }

  update() {
    this._listeners.forEach((cb) => {
      cb(this.value);
    });
  }

  drawRow(index, player, piece, canDelete) {
    const row = document.createElement('tr');
    const numberCell = document.createElement('td');
    const number = document.createElement('code');
    number.innerHTML = `${index + 1}.`;
    numberCell.appendChild(number);
    row.appendChild(numberCell);

    const playerCell = document.createElement('td');
    const playerInput = new EnumInput(
      `player-${index}`,
      undefined,
      player,
      false,
      Array(this.players)
        .fill(1)
        .map((_, i) => ({
          value: i + '',
          displayName: SYMBOLS[i] + '',
        })),
      playerCell
    );

    playerInput._input.style.color = '#' + COLORS[piece];
    playerInput._input.style.accentColor = '#' + COLORS[piece];
    playerInput.subscribe((val) => {
      this._rowValues[index].player = parseInt(val);
      this.drawRows();
    });
    row.appendChild(playerCell);

    const pieceCell = document.createElement('td');
    const pieceInput = new EnumInput(
      `piece-${index}`,
      undefined,
      piece,
      false,
      Array(this.pieces)
        .fill(1)
        .map((_, i) => ({
          value: i + '',
          displayName: i + 1 + '',
        })),
      pieceCell
    );
    pieceInput._input.style.color = '#' + COLORS[piece];
    pieceInput._input.style.accentColor = '#' + COLORS[piece];
    pieceInput.subscribe((val) => {
      this._rowValues[index].piece = parseInt(val);
      this.drawRows();
    });
    row.appendChild(pieceCell);

    const deleteButtonCell = document.createElement('td');
    const deleteButton = document.createElement('input');
    deleteButton.type = 'button';
    deleteButton.value = '⤫';
    deleteButton.disabled = !canDelete;
    deleteButton.addEventListener('click', () => {
      this.deleteRow(index);
    });
    deleteButtonCell.appendChild(deleteButton);
    row.appendChild(deleteButtonCell);

    return row;
  }

  drawRows() {
    this._tbody.innerHTML = '';
    for (let i = 0; i < this._rowValues.length; i++) {
      this._tbody.appendChild(
        this.drawRow(
          i,
          this._rowValues[i].player,
          this._rowValues[i].piece,
          i >= this.minimumTurns
        )
      );
    }

    this.update();
  }

  addRow() {
    console.log(this._rowValues.length, this.maximumTurns);
    if (this._rowValues.length >= this.maximumTurns) {
      return;
    }

    this._rowValues.push({
      player: this.players - 1,
      piece: this.pieces - 1,
    });
    this.drawRows();
  }

  deleteRow(index) {
    this._rowValues.splice(index, 1);
    this.drawRows();
  }

  /**
   * Add a function to the called when the value changes.
   * @param {(val: string) => void} cb The callback to call when the value changes.
   */
  subscribe(cb) {
    this._listeners.push(cb);
  }

  get value() {
    let rawValue = this._rowValues
      .map((val) => `${val.player}-${val.piece}`)
      .join(',');
    return rawValue;
  }

  set value(val) {
    console.log(val);
    if (val.match(/^([0-9]+-[0-9]+,)*[0-9]+-[0-9]+$/) !== null) {
      this._rowValues = val.split(',').map((v) => {
        return {
          player: Math.min(
            Math.max(parseInt(v.split('-')[0]), 0),
            this.players
          ),
          piece: Math.min(Math.max(parseInt(v.split('-')[1]), 0), this.pieces),
        };
      });
      this.drawRows();
    }
    this.update();
  }

  get minimumTurns() {
    return this._minimumTurns ?? -Infinity;
  }

  set minimumTurns(val) {
    this._minimumTurns = val;

    while (this._rowValues.length < this._minimumTurns) {
      this._rowValues.push(structuredClone(this._rowValues.at(-1)));
    }

    this.drawRows();
  }

  get maximumTurns() {
    return this._maximumTurns ?? Infinity;
  }

  set maximumTurns(val) {
    this._maximumTurns = val;

    this._rowValues = this._rowValues.slice(
      0,
      Math.min(this._maximumTurns, this._rowValues.length)
    );

    this.drawRows();
  }

  get players() {
    return this._players ?? '1'; //.split(',').length;
  }

  set players(val) {
    this._players = val;

    this.drawRows();
  }

  get pieces() {
    return (this._pieces ?? '1').split(',').length;
  }

  set pieces(val) {
    this._pieces = val;

    this.drawRows();
  }

  static parseConfig(config, parent) {
    const players =
      typeof config.players === 'number' ? config.players : undefined;
    const pieces =
      typeof config.pieces === 'number' ? config.pieces : undefined;
    const minimumTurns =
      typeof config.minimumTurns === 'number' ? config.minimumTurns : undefined;
    const maximumTurns =
      typeof config.maximumTurns === 'number' ? config.maximumTurns : undefined;

    const input = new TurnsInput(
      config.name,
      config.label,
      config.defaultValue,
      players,
      pieces,
      minimumTurns,
      maximumTurns,
      parent
    );

    if (typeof config.players === 'object') {
      getInput(config.players[0]).subscribe((val) => {
        getInput(config.name).players = val;
      });
    }

    if (typeof config.pieces === 'object') {
      getInput(config.pieces[0]).subscribe((val) => {
        getInput(config.name).pieces = val;
      });
    }

    if (typeof config.minimumTurns === 'object') {
      for (let i = 0; i < config.minimumTurns.length; i++) {
        getInput(config.minimumTurns[i]).subscribe((val) => {
          let minimumValue = getInput(config.minimumTurns[0]).value;
          for (let i = 1; i < config.minimumTurns.length; i++) {
            minimumValue = Math.min(
              minimumValue,
              getInput(config.minimumTurns[i]).value
            );
          }
          getInput(config.name).minimumTurns = minimumValue;
        });
      }
    }

    if (typeof config.maximumTurns === 'object') {
      for (let i = 0; i < config.maximumTurns.length; i++) {
        getInput(config.maximumTurns[i]).subscribe((val) => {
          let maximumValue = getInput(config.maximumTurns[0]).value;
          for (let i = 1; i < config.maximumTurns.length; i++) {
            maximumValue = Math.max(
              maximumValue,
              getInput(config.maximumTurns[i]).value
            );
          }
          getInput(config.name).maximumTurns = maximumValue;
        });
      }
    }

    addInput(config.name, input);
  }
}

class DirectionsInput {
  _defaultValue;
  _minimumTurns;
  _maximumTurns;

  _tbody;
  _rows = [];

  _listeners = [];

  constructor(name, label, defaultValue, minimumTurns, maximumTurns, parent) {
    this._defaultValue = defaultValue;
    this._minimumTurns = minimumTurns;
    this._maximumTurns = maximumTurns;
    this._rows = defaultValue.split('|');

    const table = document.createElement('table');
    table.id = name;

    const header = document.createElement('thead');
    const headerRow1 = document.createElement('tr');
    const title = document.createElement('th');
    title.innerHTML = label;
    title.colSpan = 3;
    headerRow1.appendChild(title);
    header.appendChild(headerRow1);
    table.appendChild(header);

    this._tbody = document.createElement('tbody');
    table.appendChild(this._tbody);

    this.drawRows();

    const footer = document.createElement('tfoot');
    const footerRow = document.createElement('tr');
    const footerCell = document.createElement('td');
    footerCell.colSpan = 3;
    const rowButton = document.createElement('input');
    rowButton.type = 'button';
    rowButton.value = '+ Add Angle';
    rowButton.addEventListener('click', () => this.addRow());
    footerCell.appendChild(rowButton);
    footerRow.appendChild(footerCell);
    footer.appendChild(footerRow);
    table.appendChild(footer);

    parent.appendChild(table);
  }

  update() {
    this._listeners.forEach((cb) => {
      cb(this.value);
    });
  }

  drawRow(index, direction, canDelete) {
    const row = document.createElement('tr');
    const numberCell = document.createElement('td');
    const number = document.createElement('code');
    number.innerHTML = `${index + 1}.`;
    numberCell.appendChild(number);
    row.appendChild(numberCell);

    const playerCell = document.createElement('td');
    const playerInput = new VectorInput(
      `direction-${index}`,
      undefined,
      direction,
      playerCell
    );
    playerInput.subscribe((val) => {
      this._rows[index] = val;
    });
    // playerCell.appendChild(playerInput);
    row.appendChild(playerCell);

    const deleteButtonCell = document.createElement('td');
    const deleteButton = document.createElement('input');
    deleteButton.type = 'button';
    deleteButton.value = '⤫';
    deleteButton.disabled = !canDelete;
    deleteButton.addEventListener('click', () => {
      this.deleteRow(index);
    });
    deleteButtonCell.appendChild(deleteButton);
    row.appendChild(deleteButtonCell);

    return row;
  }

  drawRows() {
    this._tbody.innerHTML = '';
    for (let i = 0; i < this._rows.length; i++) {
      this._tbody.appendChild(
        this.drawRow(i, this._rows[i], i >= this.minimumTurns)
      );
    }

    this.update();
  }

  addRow() {
    if (this._rows.length >= this.maximumTurns) {
      return;
    }

    this._rows.push('0,1');
    this.drawRows();
  }

  deleteRow(index) {
    this._rows.splice(index, 1);
    this.drawRows();
  }

  /**
   * Add a function to the called when the value changes.
   * @param {(val: string) => void} cb The callback to call when the value changes.
   */
  subscribe(cb) {
    this._listeners.push(cb);
  }

  get value() {
    let rawValue = this._rows.join('|');
    return rawValue;
  }

  set value(val) {
    if (
      val.match(/^(1)|(-1)|(0),(1)|(-1)|(0)(\|(1)|(-1)|(0),(1)|(-1)|(0))*$/) !==
      null
    ) {
      this._rows = val.split('|');
      this.drawRows();
    }
    this.update();
  }

  get minimumTurns() {
    return this._minimumTurns ?? -Infinity;
  }

  set minimumTurns(val) {
    this._minimumTurns = val;

    this.drawRows();
  }

  get maximumTurns() {
    return this._maximumTurns ?? Infinity;
  }

  set maximumTurns(val) {
    this._maximumTurns = val;

    this.drawRows();
  }

  get maximumTurns() {
    return this._maximumTurns ?? Infinity;
  }

  set maximumTurns(val) {
    this._maximumTurns = val;

    this.drawRows();
  }

  static parseConfig(config, parent) {
    const minimumTurns =
      typeof config.minimumTurns === 'number' ? config.minimumTurns : undefined;
    const maximumTurns =
      typeof config.maximumTurns === 'number' ? config.maximumTurns : undefined;

    const input = new DirectionsInput(
      config.name,
      config.label,
      config.defaultValue,
      minimumTurns,
      maximumTurns,
      parent
    );

    if (typeof config.minimumTurns === 'object') {
      for (let i = 0; i < config.minimumTurns.length; i++) {
        getInput(config.minimumTurns[i]).subscribe((val) => {
          let minimumValue = getInput(config.minimumTurns[0]).value;
          for (let i = 1; i < config.minimumTurns.length; i++) {
            minimumValue = Math.min(
              minimumValue,
              getInput(config.minimumTurns[i]).value
            );
          }
          getInput(config.name).minimumTurns = minimumValue;
        });
      }
    }

    if (typeof config.maximumTurns === 'object') {
      for (let i = 0; i < config.maximumTurns.length; i++) {
        getInput(config.maximumTurns[i]).subscribe((val) => {
          let maximumValue = getInput(config.maximumTurns[0]).value;
          for (let i = 1; i < config.maximumTurns.length; i++) {
            maximumValue = Math.max(
              maximumValue,
              getInput(config.maximumTurns[i]).value
            );
          }
          getInput(config.name).maximumTurns = maximumValue;
        });
      }
    }

    addInput(config.name, input);
  }
}

class PresetInput {
  _selection;
  _nameInput;
  _loadButton;
  _deleteButton;
  _saveButton;

  presets;

  isEditing = false;

  currentPreset;

  defaultPresets = `[{"id":"tictactoe","name":"Tic Tac Toe","options":{"allowDiagonals":true,"allowSpectators":false,"boardHeight":3,"boardWidth":3,"doGravity":false,"engine":"standard-engine","gravityAngle":"0,1","numPlayers":"2","numToConnect":3,"pieces":"1,1","preset":"tictactoe","turnPattern":"0-0,1-1"}},{"id":"gomomku","name":"Gomomku","options":{"turnPattern":"0-0,1-1","pieces":"1,1","gravityAngle":"0,1","doGravity":false,"allowDiagonals":true,"numToConnect":5,"boardHeight":15,"boardWidth":15,"allowSpectators":false,"numPlayers":"2","engine":"standard-engine"}},{"id":"playertictactoe","name":"3 Player Tic Tac Toe","options":{"turnPattern":"0-0,1-1,2-2","pieces":"1,1,1","gravityAngle":"0,1","doGravity":false,"allowDiagonals":true,"numToConnect":3,"boardHeight":6,"boardWidth":6,"allowSpectators":false,"numPlayers":"2","engine":"standard-engine"}}]`;

  constructor(name, defaultValue, parent) {
    this.presets = JSON.parse(
      localStorage.getItem('presets') ?? this.defaultPresets
    );

    this._selection = new EnumInput(
      name + '-presetSelection',
      undefined,
      defaultValue,
      false,
      this.presets.map((val) => ({ value: val.id, displayName: val.name })),
      parent
    );

    this.currentPreset = defaultValue;

    this._selection.subscribe((val) => {
      if (val === 'custom') {
        this._loadButton.disabled = true;
      } else {
        this._loadButton.disabled = false;
      }
    });

    this._loadButton = document.createElement('input');
    this._loadButton.type = 'button';
    this._loadButton.value = 'Load';
    this._loadButton.disabled = true;
    this._loadButton.addEventListener('click', () => {
      this.load();
    });
    parent.appendChild(this._loadButton);

    this._deleteButton = document.createElement('input');
    this._deleteButton.type = 'button';
    this._deleteButton.value = 'Delete';
    this._deleteButton.addEventListener('click', () => {
      this.delete();
    });
    parent.appendChild(this._deleteButton);
    parent.appendChild(document.createElement('br'));

    this._nameInput = new TextInput(
      name + '-presetName',
      undefined,
      '',
      'Name',
      parent
    );
    this._nameInput._input.disabled = true;
    this._nameInput.subscribe((val) => {
      console.log(val);
      if ((val ?? '') === '') {
        this._saveButton.disabled = true;
      } else {
        this._saveButton.disabled = false;
      }
    });

    this._saveButton = document.createElement('input');
    this._saveButton.type = 'button';
    this._saveButton.value = 'Save';
    this._saveButton.disabled = true;
    this._saveButton.addEventListener('click', () => {
      this.save();
    });
    parent.appendChild(this._saveButton);
  }

  updateDisplay() {
    this.presets = JSON.parse(
      localStorage.getItem('presets') ?? this.defaultPresets
    );
    if (this.isEditing) {
      this._nameInput._input.disabled = false;
      this._saveButton.disabled = this._nameInput.value === '';
      this._deleteButton.disabled = true;
      this._selection.options = [
        { value: 'custom', displayName: 'Custom' },
      ].concat(
        this.presets.map((val) => ({
          value: val.id,
          displayName: val.name,
        }))
      );
      this._selection.value = 'custom';
    } else {
      this._nameInput._input.disabled = true;
      this._saveButton.disabled = true;
      this._loadButton.disabled = this._selection.value === this.currentPreset;
      this._deleteButton.disabled = false;
      this._selection.options = this.presets.map((val) => ({
        value: val.id,
        displayName: val.name,
      }));
    }
  }

  load() {
    const preset = this.presets
      .filter((val) => {
        return val.id === this._selection.value;
      })
      .at(0);

    this.currentPreset = this._selection.value;

    inputs['engine'].value = preset.options['engine'];
  }

  applyPreset() {
    if (this.currentPreset === '-') {
      return;
    }

    const inputNames = Object.keys(inputs);
    const preset = this.presets
      .filter((val) => {
        return val.id === this.currentPreset;
      })
      .at(0);
    for (let i = 0; i < inputNames.length; i++) {
      if (inputNames[i] === 'engine') {
        continue;
      }
      console.log(preset.options[inputNames[i]], inputs[inputNames[i]].value);
      inputs[inputNames[i]].value = preset.options[inputNames[i]];
    }
    this.isEditing = false;
    this._selection.value = this.currentPreset;
    this.updateDisplay();
    this._selection.value = this.currentPreset;
  }

  save() {
    let preset = {};
    const inputNames = Object.keys(inputs);
    for (let i = 0; i < inputNames.length; i++) {
      preset = { ...preset, [inputNames[i]]: inputs[inputNames[i]].value };
    }

    localStorage.setItem(
      'presets',
      JSON.stringify([
        ...this.presets,
        {
          id: this._nameInput.value.replaceAll(/[^a-zA-Z]*/g, '').toLowerCase(),
          name: this._nameInput.value,
          options: preset,
        },
      ])
    );
    this.isEditing = false;
    this.updateDisplay();
  }

  delete() {
    localStorage.setItem(
      'presets',
      JSON.stringify(
        this.presets.filter((val) => {
          return val.id !== this._selection.value;
        })
      )
    );
    this.updateDisplay();
  }

  edit() {
    this.isEditing = true;
    this.updateDisplay();
  }

  update() {}

  receiveUpdate(inputName, value) {
    this.edit();
  }

  get value() {
    return this._selection.value;
  }

  set value(val) {
    this._selection.value = val;
    this.update();
  }
}

let inputs = {};
let sectionIds = [];

function getInput(name) {
  return inputs[name];
}

function addInput(name, input) {
  inputs = { [name]: input, ...inputs };
}

function parseSections(sections) {
  const sectionContainer = document.getElementById('sections');
  for (let i = 0; i < sections.length; i++) {
    let section;
    if (document.getElementById(sections[i].name) !== null) {
      section = document.getElementById(sections[i].name);
    } else {
      section = document.createElement('fieldset');
      const title = document.createElement('legend');
      title.innerHTML = sections[i].name;
      section.appendChild(title);
      sectionIds.push(sections[i].name);
    }
    section.id = sections[i].name;

    sections[i].options.forEach((val) => {
      if (parseConfig(val, section)) {
        section.appendChild(document.createElement('br'));
      }
    });

    sectionContainer.appendChild(section);
  }
}

function parseConfig(config, parent) {
  const type = config.type;
  switch (type) {
    case 'number':
      NumberInput.parseConfig(config, parent);
      return true;
    case 'boolean':
      BooleanInput.parseConfig(config, parent);
      return true;
    case 'enum':
      EnumInput.parseConfig(config, parent);
      return true;
    case 'vector':
      VectorInput.parseConfig(config, parent);
      return true;
    case 'pieces':
      PiecesInput.parseConfig(config, parent);
      return false;
    case 'turns':
      TurnsInput.parseConfig(config, parent);
      return false;
    case 'directions':
      DirectionsInput.parseConfig(config, parent);
      return false;
  }
}

function initConfig() {
  Object.values(inputs).forEach((val) => {
    val.update();
  });
}

class ConfigurationIssue {
  /**
   *
   * @param {string} message The content of the issue
   * @param {"message"|"warning"|"error"} level The level of the issue.
   */
  constructor(message, level) {}
}
