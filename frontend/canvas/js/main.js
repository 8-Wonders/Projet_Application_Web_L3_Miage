import { Game } from "./core/game.js";

/**
 * Wait for the browser window to fully load (DOM + Scripts)
 * before starting the game initialization.
 */
window.onload = () => {
	const game = new Game();

    game.init();
};
