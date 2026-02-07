import { Player } from "./player.js";
import { Fireball } from "../projectiles/fireball.js";

export class Mage extends Player {
  constructor(x, y, w, h) {
    super(x, y, w, h, "red", 80, 200); // Low movement, less health
  }

  createProjectile(x, y, angle) {
    return new Fireball(x, y, angle, this);
  }
}
