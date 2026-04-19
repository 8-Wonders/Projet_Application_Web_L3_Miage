/**
 * @module dragon
 * @description Concrete implementation of a boss-tier enemy unit.
 * Features massive health reserves, a devastating AoE loadout, and a static behavioral matrix.
 */

import { Bot } from "./bot.js";
import { DragonBreath } from "../projectiles/dragon_breath.js";
import { StationaryAI } from "../ai/stationary.js";

/**
 * Boss-class Entity: High Hitpoints, Static Position, High Damage Output.
 * * @extends Bot
 */
export class Dragon extends Bot {
  /**
   * Instantiates the Dragon boss actor.
   * * @param {number} x - Spawning X coordinate.
   * @param {number} y - Spawning Y coordinate.
   * @param {number} width - Collision footprint width.
   * @param {number} height - Collision footprint height.
   */
  constructor(x, y, width, height) {
    // Explicitly enforce the "dragon" sprite alias
    super(x, y, width, height, "dragon");
    this.name = "Dragon";
    this.maxHealth = 150; // Boss HP scaling
    this.health = 150;

    // Loadout Initialization
    this.abilities = [DragonBreath];
    
    // Dependency Injection: Fix the entity in place as a stationary hazard
    this.setStrategy(new StationaryAI());
  }
}
