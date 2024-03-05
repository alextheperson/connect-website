const presetManager = new PresetInput(
  'presets',
  'tictactoe',
  document.getElementById('presets')
);

function load(currentEngine) {
  inputs = {};
  sectionIds.forEach((id) => {
    document.getElementById(id).remove();
  });
  sectionIds = [];

  parseSections([
    {
      name: 'General',
      options: [
        {
          name: 'engine',
          label: undefined,
          type: 'enum',
          defaultValue: currentEngine,
          options: [
            { value: 'standard-engine', displayName: 'Standard Engine' },
            { value: 'gravity-engine', displayName: 'Gravity Engine' },
            // { value: 'fractal-engine', displayName: 'Fractal Engine' },
          ],
        },
      ],
    },
  ]);

  inputs['engine'].subscribe((val) => {
    const req = new XMLHttpRequest();
    req.addEventListener('load', (req) => {
      load(val);

      parseSections(JSON.parse(req.target.response).sections);

      for (let i = 0; i < Object.keys(inputs).length; i++) {
        Object.values(inputs)[i].subscribe((val) => {
          presetManager.receiveUpdate(Object.keys(inputs)[i], val);
        });
      }
      presetManager.applyPreset();
    });
    req.open('GET', `engine/${val}/options.json`);
    req.send();
  });
}

load('standard-engine');

initConfig();

document.getElementById('form').addEventListener('submit', (e) => {
  const formData = new FormData(document.getElementById('form'));

  Object.values(inputs).forEach((val, index) => {
    formData.append(Object.keys(inputs)[index], val.value);
  });

  const request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      window.location.pathname = `/game/${this.responseText}/`;
    }
  };
  request.open('POST', 'game');
  request.send(formData);

  e.preventDefault();
});
