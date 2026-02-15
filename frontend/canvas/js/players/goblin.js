import { Bot } from "./bot.js";
import { Spear } from "../projectiles/spear.js";
import { DumbAI } from "../ai/dumb.js";

export class Goblin extends Bot {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.color = "#27AE60"; // Goblin Green
    this.name = "Goblin";

    this.abilities = [Spear];
    
    // Assign Dumb AI
    this.setStrategy(new DumbAI());
  }
}
