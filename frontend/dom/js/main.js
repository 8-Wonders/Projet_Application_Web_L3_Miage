import { GBApp } from "./app.js";

window.addEventListener("load", async () => {
  const app = new GBApp();
  await app.init();
});
