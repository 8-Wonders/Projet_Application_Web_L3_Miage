import { Player } from "./player.js";
import { Arrow } from "../projectiles/arrow.js";
import { DumbAI } from "../ai/dumb.js"; // Default fallback

/**
 * AI-controlled Entity.
 * Delegates logic to an AIStrategy.
 */
export class Bot extends Player {
  constructor(x, y, width, height) {
    super(x, y, width, height, "red", 60, 200); 
    this.damage = 15;
    this.timer = 0;

    this.abilities = [Arrow];
    
    // Default Strategy
    this.strategy = new DumbAI();
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  /**
   * AI "Brain". Called every frame during Bot's turn.
   * Delegates to the Strategy class.
   */
  updateBotLogic(map, players) {
    if (!this.turnActive || !this.strategy) return false;
    
    return this.strategy.update(this, map, players);
  }
}
