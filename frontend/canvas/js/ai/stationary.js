import { AIStrategy } from "./ai_strategy.js";

export class StationaryAI extends AIStrategy {
  update(bot, map, players) {
    bot.timer++;

    const target = this.findTarget(bot, players);
    if (!target) return true;

    // 1. Face Target immediately
    bot.facing = target.x < bot.x ? -1 : 1;

    // 2. Aim Logic
    if (!bot.isAiming) bot.toggleAim();

    const dx = (target.x + target.width / 2) - (bot.x + bot.width / 2);
    const dy = (target.y + target.height / 2) - (bot.y + bot.height / 2);
    
    bot.aimAngle = Math.atan2(dy, dx);

    // --- FRIENDLY FIRE CHECK ---
    if (this.isFriendInLineOfFire(bot, bot.aimAngle, map, players, target)) {
        // Aim STRAIGHT DOWN to hit the floor safely
        bot.aimAngle = Math.PI / 2; 
    }

    // 3. Fire
    if (bot.timer > 80) {
      bot.shoot();
      bot.timer = 0;
      return true;
    }
    
    bot.move({}, map, players);

    return false;
  }
}
