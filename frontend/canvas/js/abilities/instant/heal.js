import { Ability } from "../ability.js";

export class HealAbility extends Ability {
  constructor() {
    super("Heal", 3, "white"); // 3 turn cooldown
    this.healPercent = 0.2; // 20%
  }

  activate(owner, context) {
    if (!this.canActivate()) return null;

    // 1. Restore Health
    const healAmount = Math.floor(owner.maxHealth * this.healPercent);
    owner.health = Math.min(owner.maxHealth, owner.health + healAmount);

    // 2. Cure Status Effects (e.g. Burning)
    owner.statuses = [];

    // 3. Set Cooldown
    this.currentCooldown = this.maxCooldown;
    
    console.log(`${owner.constructor.name} healed for ${healAmount} HP.`);
    return null; // No projectile spawned
  }

  drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, size, size);

    // Red Cross
    ctx.fillStyle = "red";
    const thickness = size / 3;
    const offset = (size - thickness) / 2;
    ctx.fillRect(x + offset, y + 5, thickness, size - 10);
    ctx.fillRect(x + 5, y + offset, size - 10, thickness);
  }
}
