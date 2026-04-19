/**
 * @module archer
 * @description Concrete implementation of a versatile human-controlled class.
 * Designed around high physical movement, sustained vitality, and precision ballistic skills.
 */

import { Player } from "./player.js";
import { Arrow } from "../projectiles/arrow.js";
import { SilverArrow } from "../projectiles/silver_arrow.js";
import { Teleport } from "../projectiles/teleport.js";

/**
 * Character Class: Archer.
 * Stat Profile: High Mobility, Standard Vitality.
 * Tactical Focus: Arcing precision attacks, versatile ammo types.
 * * @extends Player
 */
export class Archer extends Player {
  /**
   * Instantiates the Archer character.
   * * @param {number} x - Starting X position.
   * @param {number} y - Starting Y position.
   * @param {number} width - Hitbox width.
   * @param {number} height - Hitbox height.
   */
  constructor(x, y, width, height) {
    // Initializes with "archer" alias, baseline HP (100), and superior movement allowance (400)
    super(x, y, width, height, "archer", 100, 400); 

    // Inject ballistic-focused hotbar configuration
    this.abilities = [Arrow, SilverArrow, Teleport];
  }
}
