/**
 * @module dumb_ai
 * @description Implements a basic, aggro-focused AI strategy. Prioritizes closing 
 * horizontal distance with minimal spatial awareness.
 */

import { AIStrategy } from "./ai_strategy.js";

/**
 * Low-tier AI Controller.
 * Relies on simple linear pathfinding toward the nearest target and direct line-of-sight aiming 
 * without ballistic compensation. Predictable and aggressive.
 * * @extends AIStrategy
 */
export class DumbAI extends AIStrategy {
  /**
   * Processes the basic behavioral logic tree for the current tick.
   * * @param {Object} bot - The bot utilizing this strategy.
   * @param {Map} map - The map instance.
   * @param {Array<Object>} players - The registry of all entities.
   * @returns {boolean} Indicates if the bot's turn has concluded.
   */
  update(bot, map, players) {
    bot.timer++;
    
    // --- PHASE 0: Wait (1 Second) ---
    // Simulates "thinking" time for fairness and telegraphing intent
    if (bot.timer < 60) return false;

    const target = this.findTarget(bot, players);
    if (!target) return true;

    // --- PHASE 1: Movement ---
    if (bot.timer > 120) bot.canMove = false;

    if (bot.canMove) {
      const keys = {};
      const dx = target.x - bot.x;

      let direction = 0;
      // Define a deadzone to prevent jittering when overlapping the target
      if (dx > 20) direction = 1;
      if (dx < -20) direction = -1;

      const safeToMove = direction !== 0 && this.isSafe(bot, map, direction);

      if (safeToMove) {
          if (direction === 1) keys["ArrowRight"] = true;
          if (direction === -1) keys["ArrowLeft"] = true;
      } else if (direction !== 0) {
          bot.canMove = false;
      }

      // Basic jump implementation: Random probability or strictly when stalled
      const stuck = (bot.vx === 0 && Math.abs(dx) > 50);
      if (bot.canMove) {
          if (Math.random() < 0.02 || (stuck && safeToMove)) keys["ArrowUp"] = true;
          bot.move(keys, map, players);
      }
    } 
    
    // Ensure movement payload is nullified if the movement phase has elapsed
    if (!bot.canMove) bot.move({}, map, players);

    // --- PHASE 2: Combat ---
    if (!bot.canMove) {
      if (!bot.isAiming) bot.toggleAim();

      // Simple direct Euclidean aiming without physics prediction
      const tX = target.x + target.width / 2;
      const tY = target.y + target.height / 2;
      const bX = bot.x + bot.width / 2;
      const bY = bot.y + bot.height / 2;

      bot.aimAngle = Math.atan2(tY - bY, tX - bX);

      // --- FRIENDLY FIRE CHECK ---
      if (this.isFriendInLineOfFire(bot, bot.aimAngle, map, players, target)) {
          // Aim STRAIGHT DOWN
          bot.aimAngle = Math.PI / 2; 
      }

      if (bot.timer > 160) {
        bot.shoot();
        bot.timer = 0; 
        return true; 
      }
    }

    return false;
  }
}
