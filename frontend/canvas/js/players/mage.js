/**
 * @module mage
 * @description Concrete implementation of a specialized human-controlled class.
 * Balanced as a 'Glass Cannon' offering high utility and damage at the cost of mobility and vitality.
 */

import { Player } from "./player.js";
import { Fireball } from "../projectiles/fireball.js";
import { Heal } from "../projectiles/heal.js";
import { Teleport } from "../projectiles/teleport.js";

/**
 * Character Class: Mage.
 * Stat Profile: Low Mobility, Low Vitality.
 * Tactical Focus: High AoE Damage (Fireball), Self-Sustain (Heal), Grid Manipulation (Teleport).
 * * @extends Player
 */
export class Mage extends Player {
  /**
   * Instantiates the Mage character.
   * * @param {number} x - Starting X position.
   * @param {number} y - Starting Y position.
   * @param {number} width - Hitbox width.
   * @param {number} height - Hitbox height.
   */
  constructor(x, y, width, height) {
    // Initializes with "mage" alias, lower HP (80), and restricted movement allowance (200)
    super(x, y, width, height, "mage", 80, 200); 

    // Inject diverse, utility-heavy hotbar configuration
    this.abilities = [Fireball, Heal, Teleport];
  }
}
