/**
 * @module dragon_breath_attack
 * @description Concrete implementation of a boss-tier AoE combat ability.
 * Encapsulates the instantiation logic for the DragonBreath physics object.
 */

import { Ability } from "../ability.js";
import { DragonBreath } from "../../projectiles/dragon_breath.js";

/**
 * * @extends Ability
 */
export class DragonBreathAttack extends Ability {
  /**
   * Configures the breath attack with a heavy 4-turn cooldown penalty.
   */
  constructor() {
    super("Dragon Breath", 4, "red"); // 4 turn cooldown
  }

  /**
   * Resolves trajectory vectors and spawns the breath projectile.
   * * @override
   */
  activate(owner, context) {
    // Enforce cooldown lock
    if (!this.canActivate()) return null;

    // Resolve emission origin (center mass)
    const cx = owner.x + owner.width / 2;
    const cy = owner.y + owner.height / 2;
    
    // Push the spawn point slightly outside the hitbox to prevent immediate self-collision
    const offset = owner.width / 1.5;
    const angle = owner.isAiming ? owner.aimAngle : (owner.facing === 1 ? 0 : Math.PI);

    const startX = cx + Math.cos(angle) * offset;
    const startY = cy + Math.sin(angle) * offset;

    // Create the deferred physics payload
    const breath = new DragonBreath(startX, startY, angle, owner);

    // Lock the ability
    this.currentCooldown = this.maxCooldown;
    return breath;
  }
  
  /**
   * Overrides generic UI rendering with a specific thematic icon.
   * * @override
   */
  drawIcon(ctx, x, y, size) {
     ctx.fillStyle = "#8B0000"; // Dark Red
     ctx.fillRect(x, y, size, size);
     
     // Magma core motif
     ctx.fillStyle = "orange";
     ctx.beginPath();
     ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
     ctx.fill();
  }
}
