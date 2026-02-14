import { Projectile } from "./projectile.js";

/**
 * A special "Projectile" that applies an immediate self-buff.
 * It doesn't move or hit enemies.
 */
export class Heal extends Projectile {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner, 0); // 0 damage
    
    // Config
    this.healPercent = 0.2; // 20%
    this.active = false; // Immediately deactivate (doesn't exist in world)

    // --- Apply Effects Immediately ---
    
    // 1. Restore Health
    const healAmount = Math.floor(owner.maxHealth * this.healPercent);
    owner.health = Math.min(owner.maxHealth, owner.health + healAmount);

    // 2. Cure Status Effects
    owner.statuses = [];

    // 3. Visual Feedback (Optional - console or simple effect spawn logic could go here)
    // Since this object dies immediately, we can't draw it in the main loop.
  }

  // Static method for UI rendering
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, size, size);

    // Draw Red Cross
    ctx.fillStyle = "red";
    const thickness = size / 3;
    const offset = (size - thickness) / 2;
    
    // Vertical rect
    ctx.fillRect(x + offset, y + 5, thickness, size - 10);
    // Horizontal rect
    ctx.fillRect(x + 5, y + offset, size - 10, thickness);
  }
}
