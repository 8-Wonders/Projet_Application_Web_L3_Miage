import { Bot } from "./bot.js";
import { Spear } from "../projectiles/spear.js";

export class Goblin extends Bot {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.color = "#27AE60"; // Goblin Green
    this.name = "Goblin";
  }

  createProjectile(x, y, angle) {
    // Throws Spears (Heavy gravity, high damage)
    return new Spear(x, y, angle, this);
  }
}
