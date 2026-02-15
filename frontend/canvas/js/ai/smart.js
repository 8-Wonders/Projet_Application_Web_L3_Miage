import { AIStrategy } from "./ai_strategy.js";

export class SmartAI extends AIStrategy {
  update(bot, map, players) {
    bot.timer++;

    // --- PHASE 0: Wait (1 Second) ---
    if (bot.timer < 60) return false;

    const target = this.findTarget(bot, players);
    if (!target) return true;

    const dist = Math.abs(target.x - bot.x);
    const optimalDist = 350; 

    if (bot.timer > 120) bot.canMove = false;

    // --- PHASE 1: Tactical Movement ---
    if (bot.canMove) {
      const keys = {};
      if (dist < optimalDist - 50) {
        const dir = target.x < bot.x ? 1 : -1;
        if (this.isSafe(bot, map, dir)) {
             keys[dir === 1 ? "ArrowRight" : "ArrowLeft"] = true;
        } else {
             bot.canMove = false;
        }
      } else if (dist > optimalDist + 50) {
        const dir = target.x < bot.x ? -1 : 1;
        if (this.isSafe(bot, map, dir)) {
             keys[dir === 1 ? "ArrowRight" : "ArrowLeft"] = true;
        } else {
             bot.canMove = false;
        }
      }
      
      if (bot.canMove) {
          if (Math.abs(bot.vx) < 0.5 && (keys["ArrowLeft"] || keys["ArrowRight"])) {
             keys["ArrowUp"] = true;
          }
          bot.move(keys, map, players);
      }
    }

    if (!bot.canMove) bot.move({}, map, players);

    // --- PHASE 2: Combat ---
    if (!bot.canMove) {
      if (!bot.isAiming) bot.toggleAim();

      const dx = (target.x + target.width / 2) - (bot.x + bot.width / 2);
      const dy = (target.y + target.height / 2) - (bot.y + bot.height / 2);

      const gravityComp = Math.abs(dx) * 0.4; 

      bot.aimAngle = Math.atan2(dy - gravityComp, dx);

      // --- FRIENDLY FIRE CHECK ---
      if (this.isFriendInLineOfFire(bot, bot.aimAngle, map, players, target)) {
          // Aim STRAIGHT DOWN
          bot.aimAngle = Math.PI / 2;
      }

      if (bot.timer > 180) {
        bot.shoot();
        bot.timer = 0;
        return true;
      }
    }

    return false;
  }
}
