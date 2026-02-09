import { Player } from "./player.js";
import { Arrow } from "../projectiles/arrow.js";

export class Archer extends Player {
  constructor(x, y, width, height) {
    super(x, y, width, height, "green", 100, 400); // High movement
  }

  createProjectile(x, y, angle) {
    return new Arrow(x, y, angle, this);
  }
}
