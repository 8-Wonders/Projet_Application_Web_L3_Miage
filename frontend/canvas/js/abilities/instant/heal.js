/**
 * @module heal
 * @description Immediate-execution utility ability. 
 * Applies internal state mutations (vitality restoration, status queue purging) rather than physical manifestations.
 */

import { Ability } from "../ability.js";

/**
 * Executes a self-targeted vitality buff and debuff cleanse.
 * * @extends Ability
 */
export class HealAbility extends Ability {
  /**
   * Configures the restoration ability with a baseline 3-turn cooldown.
   */
  constructor() {
    super("Heal", 3, "white"); // 3 turn cooldown
    
    /** @property {number} healPercent - Scalar representing the % of maxHP to restore (0.2 = 20%). */
    this.healPercent = 0.2; 
  }

  /**
   * Directly mutates the owner's vitality and status arrays.
   * * @override
   * @returns {null} Always returns null as no deferred physics object is generated.
   */
  activate(owner, context) {
    if (!this.canActivate()) return null;

    // 1. Restore Health (Strictly capped at the class-defined maximum)
    const healAmount = Math.floor(owner.maxHealth * this.healPercent);
    owner.health = Math.min(owner.maxHealth, owner.health + healAmount);

    // 2. Cure Status Effects (Flush the entity's debuff queue entirely)
    owner.statuses = [];

    // 3. Lock the ability state
    this.currentCooldown = this.maxCooldown;
    
    console.log(`${owner.constructor.name} healed for ${healAmount} HP.`);
    return null; // No projectile spawned
  }

  /**
   * * @override
   */
  drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, size, size);

    // Universal Red Restorative Cross Motif
    ctx.fillStyle = "red";
    const thickness = size / 3;
    const offset = (size - thickness) / 2;
    ctx.fillRect(x + offset, y + 5, thickness, size - 10); // Vertical stem
    ctx.fillRect(x + 5, y + offset, size - 10, thickness); // Horizontal arms
  }
}
