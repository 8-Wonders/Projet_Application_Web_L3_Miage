/**
 * @module stationary_ai
 * @description Implements an immobile sentry-style AI. Functions as a fixed turret 
 * lacking movement capabilities but retaining standard targeting systems.
 */

import { AIStrategy } from "./ai_strategy.js";

/**
 * Fixed-position AI Controller.
 * Skips the movement phase entirely. Rotates to face the target and fires 
 * directly based on Euclidean geometry. Useful for bosses, static hazards, or tutorial dummies.
 * * @extends AIStrategy
 */
export class StationaryAI extends AIStrategy {
  /**
   * Processes the stationary behavioral logic tree for the current tick.
   * * @param {Object} bot - The bot utilizing this strategy.
   * @param {Map} map - The map instance.
   * @param {Array<Object>} players - The registry of all entities.
   * @returns {boolean} Indicates if the bot's turn has concluded.
   */
  update(bot, map, players) {
    bot.timer++;

    const target = this.findTarget(bot, players);
    if (!target) return true;

    // 1. Face Target immediately
    // Updates sprite rendering orientation without applying spatial translation
    bot.facing = target.x < bot.x ? -1 : 1;

    // 2. Aim Logic
    if (!bot.isAiming) bot.toggleAim();

    // Calculate strict geometric delta to target
    const dx = (target.x + target.width / 2) - (bot.x + bot.width / 2);
    const dy = (target.y + target.height / 2) - (bot.y + bot.height / 2);
    
    bot.aimAngle = Math.atan2(dy, dx);

    // --- FRIENDLY FIRE CHECK ---
    if (this.isFriendInLineOfFire(bot, bot.aimAngle, map, players, target)) {
        // Aim STRAIGHT DOWN to hit the floor safely
        bot.aimAngle = Math.PI / 2; 
    }

    // 3. Fire
    // Expedited firing sequence since no movement calculations are required
    if (bot.timer > 80) {
      bot.shoot();
      bot.timer = 0;
      return true;
    }
    
    // Emit an empty movement payload to ensure the physics engine processes zero velocity
    bot.move({}, map, players);

    return false;
  }
}
