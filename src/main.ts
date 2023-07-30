import "./style.css";
import { renderHomePage } from "./pages/home.ts";
import { renderConfigurationPage } from "./pages/configuration.ts";
import { renderGamePage } from "./pages/game.ts";

const app = document.querySelector<HTMLDivElement>("#app");
const page = window.location.pathname.slice(1);
console.log(page);
if (app) {
  if (page === "") {
    renderHomePage(app);
  } else if (page === "configure") {
    renderConfigurationPage(app);
  } else if (page.match(/play\/[0-9]{9}/)) {
    renderGamePage(app);
  }
} else {
  alert(
    'Oh Crap. Something went very wrong. No HTML element with the ID "app" was found'
  );
}

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
