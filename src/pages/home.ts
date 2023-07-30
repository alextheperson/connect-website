import { renderConfigurationPage } from "./configuration";
import { renderEnterCodePage } from "./enter-code";

export function renderHomePage(target: HTMLDivElement) {
  target.innerHTML = `<div>
    <h1>Connect <i style="font-family: serif">n</i></h1>
    <div class="buttons column">
    <button class="primary" id="join">Join Game &rarr;</button>
    <a href="configure" class="button primary">Start Game &rarr;</a>
    </div>
  </div>
`;

  target
    .querySelector<HTMLButtonElement>("#join")
    ?.addEventListener("click", () => renderEnterCodePage(target));
}
