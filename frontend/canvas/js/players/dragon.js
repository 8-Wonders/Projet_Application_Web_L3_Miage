import { Bot } from "./bot.js";
import { DragonBreath } from "../projectiles/dragon_breath.js";

export class Dragon extends Bot {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.color = "#8E44AD"; // Purple
    this.name = "Dragon";
    this.maxHealth = 150; // Boss HP
    this.health = 150;
  }

  createProjectile(x, y, angle) {
    // Breaths Fire (Short range, DoT)
    return new DragonBreath(x, y, angle, this);
  }
}
