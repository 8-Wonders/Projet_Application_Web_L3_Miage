import { Bot } from "./bot.js";
import { DragonBreath } from "../projectiles/dragon_breath.js";
import { StationaryAI } from "../ai/stationary.js";

export class Dragon extends Bot {
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.color = "#8E44AD"; // Purple
    this.name = "Dragon";
    this.maxHealth = 150; // Boss HP
    this.health = 150;

    this.abilities = [DragonBreath];
    
    // Assign Stationary AI
    this.setStrategy(new StationaryAI());
  }
}
