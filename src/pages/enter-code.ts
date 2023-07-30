export function renderEnterCodePage(target: HTMLDivElement) {
  target.innerHTML = `
  <div>
  <h1>Enter Game Code</h1>
 <input id="code" placeholder="000000000" class="big" pattern="[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]">
<div class="no-text buttons fieldset">
<a href="./" class="button">&larr; Cancel</a>
<button class="primary" id="join">Join &rarr;</button>
</div>
 </div>`;

  target
    .querySelector<HTMLButtonElement>("#join")
    ?.addEventListener("click", () => {
      const codeInput = target.querySelector<HTMLInputElement>("#code");
      if (codeInput?.validity.valid) {
        window.location.pathname = `play/${codeInput!.value ?? "000000000"}`;
      } else {
        alert("The game code should be a 9-digit number");
      }
    });
}
