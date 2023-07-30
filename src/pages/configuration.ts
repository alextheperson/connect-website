export function renderConfigurationPage(target: HTMLDivElement) {
  target.innerHTML = `
  <div>
  <h1>Configure Game</h1>
 <form>
 <fieldset>
    <legend>Dimensions</legend>
    <input type="number" value="3"> X <input type="number" value="3">
 </fieldset>
<fieldset>
    <legend>Win Condition</legend>
<input type="number" value="3" min="2" max="3"> in a row<br>
<input type="checkbox"> Diagonals
</fieldset>
<fieldset>
    <legend>Play</legend>
<input type="checkbox"> Gravity<br>
<input type="number" min="2" max="10"> Players
</fieldset>
<fieldset>
    <legend>Miscellaneous</legend>
<input type="checkbox"> Fractal<br>
Display as <select>
<option>Chips</option>
<option>Shapes</option>
</select>
</fieldset>
<fieldset class="no-text buttons">
<a href="./" class="button">&larr; Cancel</a>
<button class="primary">Start Game &rarr;</button>
</fieldset>
 </form>
 </div>`;
}
