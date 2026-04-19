/**
 * @module ai_strategy
 * @description Defines the abstract base class and core heuristics for Artificial Intelligence controllers.
 */

import { tilesTypes } from "../map.js";

/**
 * Base abstract class defining the contract for AI behaviors.
 * Provides shared sensory algorithms (target acquisition, terrain analysis, raycasting) 
 * utilized by specific behavioral implementations.
 * * @abstract
 */
export class AIStrategy {
  /**
   * The core decision-making loop, invoked per frame or tick.
   * Subclasses MUST override this method to provide specific behavioral logic.
   * * @param {Object} bot - The bot entity executing this strategy.
   * @param {Map} map - The current map instance for spatial awareness.
   * @param {Array<Object>} players - The global registry of all active entities (players/bots) in the match.
   * @returns {boolean} True if the bot has completed an action that concludes its turn (e.g., firing), false otherwise.
   */
  update(bot, map, players) {
    console.warn("Base AI update called - override this method.");
    return true; 
  }

  /**
   * Analyzes the entity registry to locate the nearest hostile, human-controlled target.
   * Evaluates Manhattan distance as a performant heuristic for proximity.
   * * @param {Object} bot - The bot requesting target acquisition.
   * @param {Array<Object>} players - The global registry of all active entities.
   * @returns {Object|null} Returns the closest hostile entity, or null if no valid targets remain.
   */
  findTarget(bot, players) {
    let nearest = null;
    let minDist = Infinity;

    players.forEach(p => {
      // Filter: Must not be self, must be alive.
      // Filter: Must NOT be a Bot.
      const isBot = typeof p.strategy !== 'undefined';

      if (p !== bot && p.health > 0 && !isBot) {
        const dist = Math.abs(p.x - bot.x) + Math.abs(p.y - bot.y);
        if (dist < minDist) {
          minDist = dist;
          nearest = p;
        }
      }
    });

    return nearest;
  }

  /**
   * Predictive collision detection. Simulates a horizontal movement vector to evaluate 
   * environmental safety, preventing the bot from pathing into hazards (like water/pits) 
   * or attempting to walk through solid geometry.
   * * @param {Object} bot - The bot evaluating movement.
   * @param {Map} map - The current map instance.
   * @param {number} direction - The normalized movement vector (1 for Right, -1 for Left).
   * @returns {boolean} True if the calculated trajectory resolves to a walkable, non-hazardous surface.
   */
  isSafe(bot, map, direction) {
    const tileSize = map.tileSize;
    const lookAhead = 20; 
    const aheadX = direction === 1 ? bot.x + bot.width + lookAhead : bot.x - lookAhead;
    const col = Math.floor(aheadX / tileSize);
    
    // 1. WALL CHECK
    const startRow = Math.floor(bot.y / tileSize);
    const endRow = Math.floor((bot.y + bot.height - 1) / tileSize);

    for (let row = startRow; row <= endRow; row++) {
      if (map.getTile(col, row) === tilesTypes.water) return false;
    }

    // 2. PIT FALL CHECK
    const startFootRow = Math.floor((bot.y + bot.height) / tileSize);
    for (let i = 0; i < 8; i++) {
        const checkRow = startFootRow + i;
        const tile = map.getTile(col, checkRow);
        if (tile === tilesTypes.brick || tile === tilesTypes.stone) return true;
        if (tile === tilesTypes.water) return false;
    }
    return false;
  }

  /**
   * Implements a linear raycast algorithm to evaluate the projected trajectory of an attack.
   * Determines if a friendly entity intersects with the firing line before impacting the terrain 
   * or the intended target. Prevents AI from executing friendly fire.
   * * @param {Object} bot - The acting bot.
   * @param {number} aimAngle - The calculated trajectory angle in radians.
   * @param {Map} map - The current map instance for checking solid geometry occlusion.
   * @param {Array<Object>} players - The registry of entities to check against the raycast.
   * @param {Object} target - The primary target entity (ignored if intersected).
   * @returns {boolean} True if a friendly unit is within the expanded hit volume of the trajectory.
   */
  isFriendInLineOfFire(bot, aimAngle, map, players, target) {
    const cx = bot.x + bot.width / 2;
    const cy = bot.y + bot.height / 2;
    const range = 800; 
    const step = 20;   
    const safetyMargin = 60; // Increased to 60 to catch large hitboxes/spears
    
    const cos = Math.cos(aimAngle);
    const sin = Math.sin(aimAngle);

    // Start checking VERY close (10px) to catch friends standing directly on top/adjacent
    for (let d = 10; d < range; d += step) {
        const px = cx + cos * d;
        const py = cy + sin * d;

        // 1. Wall Check
        const col = Math.floor(px / map.tileSize);
        const row = Math.floor(py / map.tileSize);
        const tile = map.getTile(col, row);
        if (tile === tilesTypes.brick || tile === tilesTypes.stone) {
            return false; // Wall blocked the shot, safe.
        }

        // 2. Entity Check
        for (const p of players) {
            if (p !== bot && p.health > 0) {
                // Check intersection with EXPANDED hitbox
                if (px >= p.x - safetyMargin && px <= p.x + p.width + safetyMargin &&
                    py >= p.y - safetyMargin && py <= p.y + p.height + safetyMargin) {
                    
                    if (p === target) return false; // Hitting target is good
                    if (typeof p.strategy !== 'undefined') return true; // Hitting friend is bad
                }
            }
        }
    }
    return false;
  }
}
