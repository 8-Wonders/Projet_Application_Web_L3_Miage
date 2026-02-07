import { Player } from "./player.js";
import { Arrow } from "../projectiles/arrow.js";

export class Archer extends Player {
  constructor(x, y, w, h) {
    super(x, y, w, h, "green", 100, 400); // High movement
  }

  createProjectile(x, y, angle) {
    return new Arrow(x, y, angle, this);
  }
}
