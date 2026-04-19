/**
 * @module goblin
 * @description Concrete implementation of a standard infantry-tier enemy unit.
 * Relies on basic tracking AI and standard spear ballistics.
 */

import { Bot } from "./bot.js";
import { Spear } from "../projectiles/spear.js";
import { DumbAI } from "../ai/dumb.js";

/**
 * Grunt-class Entity: Low Hitpoints, Linear Pathfinding, Basic Damage.
 * * @extends Bot
 */
export class Goblin extends Bot {
  /**
   * Instantiates the Goblin grunt actor.
   * * @param {number} x - Spawning X coordinate.
   * @param {number} y - Spawning Y coordinate.
   * @param {number} width - Collision footprint width.
   * @param {number} height - Collision footprint height.
   */
  constructor(x, y, width, height) {
    // Explicitly enforce the "goblin" sprite alias
    super(x, y, width, height, "goblin");
    this.name = "Goblin";

    // Loadout Initialization
    this.abilities = [Spear];
    
    // Dependency Injection: Utilize aggressive but simple heuristic logic
    this.setStrategy(new DumbAI());
  }
}
