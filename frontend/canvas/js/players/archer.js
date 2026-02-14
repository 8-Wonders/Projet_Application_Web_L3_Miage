import { Player } from "./player.js";
import { Arrow } from "../projectiles/arrow.js";

/**
 * Class: High Mobility, Standard Damage, Arcing Projectile.
 */
export class Archer extends Player {
  constructor(x, y, width, height) {
    // Green color, 100 HP, High movement range (400)
    super(x, y, width, height, "green", 100, 400); 
  }

  createProjectile(x, y, angle) {
    return new Arrow(x, y, angle, this);
  }
}
