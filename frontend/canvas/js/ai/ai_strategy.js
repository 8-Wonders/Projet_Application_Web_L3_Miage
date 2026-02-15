import { tilesTypes } from "../map.js";

/**
 * Base Interface for AI logic.
 * All specific AI brains should extend this class.
 */
export class AIStrategy {
  /**
   * Main AI loop.
   */
  update(bot, map, players) {
    console.warn("Base AI update called - override this method.");
    return true; 
  }

  /**
   * Helper: Finds the nearest living enemy (Human Player).
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
   * Checks if moving in a direction is safe.
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
   * Raycast to check if a friendly bot is in the line of fire.
   * Includes a larger SAFETY MARGIN to account for projectile width.
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
