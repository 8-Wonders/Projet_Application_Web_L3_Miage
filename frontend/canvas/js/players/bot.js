/**
 * @module bot
 * @description Serves as the abstraction layer connecting standard physical entities with AI control systems.
 * Implements the Strategy Pattern to dynamically assign cognitive logic to NPCs.
 */

import { Player } from "./player.js";
import { Arrow } from "../projectiles/arrow.js";
import { DumbAI } from "../ai/dumb.js";

/**
 * AI-controlled Entity. Extends the base Player mechanics while hijacking 
 * the input sequence with programmatic directives.
 * * @extends Player
 */
export class Bot extends Player {
  /**
   * Initializes an AI actor.
   * * @param {number} x - Absolute X coordinate.
   * @param {number} y - Absolute Y coordinate.
   * @param {number} width - Horizontal bounding box footprint.
   * @param {number} height - Vertical bounding box footprint.
   * @param {string} [color="red"] - String identifier for sprite resolution. Defaults to red for enemies.
   */
  constructor(x, y, width, height, color = "red") {
    // Inject standard AI stat restrictions (lower movement, standardized HP)
    super(x, y, width, height, color, 60, 200); 
    this.damage = 15;
    this.timer = 0; // State machine tick counter utilized by the AI brain

    this.abilities = [Arrow];
    
    // Default Strategy Initialization
    this.strategy = new DumbAI();
  }

  /**
   * Injects an implementation of the AIStrategy contract into this bot.
   * Allows for dynamic behavioral swaps at runtime.
   * * @param {AIStrategy} strategy - An initialized AI logic handler (e.g., SmartAI, StationaryAI).
   */
  setStrategy(strategy) {
    this.strategy = strategy;
  }

  /**
   * AI "Brain" hook. Invoked globally per frame uniquely during this bot's turn.
   * Delegates all decision-making (movement, aiming, firing) to the injected Strategy.
   * * @param {Map} map - The spatial grid instance.
   * @param {Array<Player>} players - Registry of entities for targeting arrays.
   * @returns {boolean} True if the strategy signals turn completion, false if still acting.
   */
  updateBotLogic(map, players) {
    if (!this.turnActive || !this.strategy) return false;
    
    return this.strategy.update(this, map, players);
  }
}
