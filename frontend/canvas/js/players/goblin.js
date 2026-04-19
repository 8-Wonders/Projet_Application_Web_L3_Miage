import { Bot } from "./bot.js";
import { Spear } from "../projectiles/spear.js";
import { DumbAI } from "../ai/dumb.js";

export class Goblin extends Bot {
  constructor(x, y, width, height) {
    // CORRECTED: Explicitly pass "goblin" up the chain
    super(x, y, width, height, "goblin");
    this.name = "Goblin";

    this.abilities = [Spear];
    
    // Assign Dumb AI
    this.setStrategy(new DumbAI());
  }
}
