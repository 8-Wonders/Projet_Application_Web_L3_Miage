import { Game } from "./core/game.js";

// Create the single Game instance
const game = new Game();

/**
 * Wait for the browser window to fully load (DOM + Scripts)
 * before starting the game initialization.
 */
window.onload = () => {
    game.init();
};
