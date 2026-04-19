import { Bot } from "./bot.js";
import { DragonBreath } from "../projectiles/dragon_breath.js";
import { StationaryAI } from "../ai/stationary.js";

export class Dragon extends Bot {
  constructor(x, y, width, height) {
    // CORRECTED: Explicitly pass "dragon" up the chain
    super(x, y, width, height, "dragon");
    this.name = "Dragon";
    this.maxHealth = 150; // Boss HP
    this.health = 150;

    this.abilities = [DragonBreath];
    
    // Assign Stationary AI
    this.setStrategy(new StationaryAI());
  }
}
