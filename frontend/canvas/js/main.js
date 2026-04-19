/**
 * @module main
 * @description Application entry point. Orchestrates the initialization of the primary game loop 
 * and core engine dependencies once the browser environment is fully resolved.
 */

import { Game } from "./core/game.js";

/**
 * Global event listener for the window load event.
 * Ensures all DOM elements, external scripts, and synchronous assets are fully loaded 
 * into memory before instantiating the game engine to prevent race conditions.
 */
window.onload = () => {
    const game = new Game();

    game.init();
};
