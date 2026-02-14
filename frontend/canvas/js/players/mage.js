import { Player } from "./player.js";
import { Fireball } from "../projectiles/fireball.js";
import { Heal } from "../projectiles/heal.js";
import { Teleport } from "../projectiles/teleport.js";

/**
 * Class: Low Mobility, High Damage, Exploding Projectile.
 */
export class Mage extends Player {
  constructor(x, y, width, height) {
    // Red color, Lower HP (80), Low movement (200)
    super(x, y, width, height, "red", 80, 200); 

    // Define Loadout
    this.abilities = [Fireball, Heal, Teleport];
  }
}
