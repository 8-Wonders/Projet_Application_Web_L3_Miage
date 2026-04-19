/**
 * @module heal
 * @description Immediate-execution utility ability. Extends Projectile for UI/Hotbar polymorphism 
 * but applies internal state mutation (vitality restoration, status purging) instead of spawning a physical asset.
 */

import { Projectile } from "./projectile.js";

/**
 * Executes a self-targeted buff and debuff cleanse.
 * * @extends Projectile
 */
export class Heal extends Projectile {
  /**
   * Executes the restoration logic immediately within the constructor.
   * * @param {number} x - Required for polymorphic construction.
   * @param {number} y - Required for polymorphic construction.
   * @param {number} angle - Unused.
   * @param {Player} owner - The target entity for restoration.
   */
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner, 0); // 0 damage payload
    
    // Configuration Directives
    this.healPercent = 0.2; // 20% max vitality restoration
    // Ensures immediate teardown by the garbage collector on the next frame loop.
    this.active = false; 

    // --- Execute Immediate State Mutation ---
    
    // 1. Restore Health (Capped at class-defined maximum)
    const healAmount = Math.floor(owner.maxHealth * this.healPercent);
    owner.health = Math.min(owner.maxHealth, owner.health + healAmount);

    // 2. Cure Status Effects (Flush the entity's debuff queue)
    owner.statuses = [];

    // 3. Visual Feedback (Optional - console or simple effect spawn logic could go here)
    // Since this object is instantly marked inactive, it avoids the standard render pipeline.
  }

  /**
   * * @override
   */
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, size, size);

    // Draw Universal Restorative Cross
    ctx.fillStyle = "red";
    const thickness = size / 3;
    const offset = (size - thickness) / 2;
    
    // Vertical rect
    ctx.fillRect(x + offset, y + 5, thickness, size - 10);
    // Horizontal rect
    ctx.fillRect(x + 5, y + offset, size - 10, thickness);
  }
}
