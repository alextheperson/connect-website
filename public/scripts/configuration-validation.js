const presetManager = new PresetInput(
  'presets',
  'tictactoe',
  document.getElementById('presets')
);

let generalConfigOptions = {}


function loadGeneralConfig() {
  const req = new XMLHttpRequest();
  req.addEventListener('load', (req) => {
    generalConfigOptions = JSON.parse(req.target.response);

    createConfig("standard-engine")
  });
  req.open('GET', `config/general-options.json`);
  req.send();
}

/**
 * Query the server to get the config options for the selected engine
 * @param {string} engineName The name of the engine to get the config options for
 */
function createConfig(engineName) {
  const req = new XMLHttpRequest();

  req.addEventListener('load', (req) => {
    // Clear the old config
    document.getElementById("sections").innerHTML = '';
    inputs = []

    // Create the new config
    parseSections(generalConfigOptions.sections);
    parseSections(JSON.parse(req.target.response).sections);

    // Subscribe the preset manager to every input so that it can know when anything changes.
    for (let i = 0; i < Object.keys(inputs).length; i++) {
      Object.values(inputs)[i].subscribe((_val) => {
        presetManager.edit();
      });
    }

    // Set the value of the engine selector to the currently selected engine
    inputs["engine"].value = engineName

    // Subscribe to the engine dropdown, so that the configuration can be reloaded when it changes.
    inputs['engine'].subscribe(createConfig);

    // We apply the preset here, because loading the preset would overwrite it if we applied it earlier (like when we choose the engine)
    presetManager.applyPreset()
  });

  req.open('GET', `engine/${engineName}/options.json`);
  req.send();
}

// Load the config for the first time
loadGeneralConfig()

document.getElementById('form').addEventListener('submit', (e) => {
  const formData = new FormData(document.getElementById('form'));

  Object.values(inputs).forEach((val, index) => {
    formData.append(Object.keys(inputs)[index], val.value);
  });

  const request = new XMLHttpRequest();
  request.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      // I have to do this evil stuff because I might not be at the root. It just trims off a bit of the URL before adding things.
      window.location.pathname =
        window.location.pathname.split('/').slice(0, -1).join('/') +
        `/game/${this.responseText}/`;
    }
  };
  request.open('POST', 'game');
  request.send(formData);

  e.preventDefault();
});
