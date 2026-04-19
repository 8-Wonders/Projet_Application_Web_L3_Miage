/**
 * @module fireball_spell
 * @description Concrete implementation of a mage-class combat spell.
 * Delegates the stochastic jitter and physics resolution directly to the generated Fireball entity.
 */

import { Ability } from "../ability.js";
import { Fireball } from "../../projectiles/fireball.js";

/**
 * * @extends Ability
 */
export class FireballSpell extends Ability {
  /**
   * Configures the fireball spell with a moderate 2-turn cooldown.
   */
  constructor() {
    super("Fireball", 2, "orange"); // 2 turn cooldown
  }

  /**
   * Calculates ballistic emission coordinates and resets the cooldown state.
   * * @override
   */
  activate(owner, context) {
    if (!this.canActivate()) return null;

    const cx = owner.x + owner.width / 2;
    const cy = owner.y + owner.height / 2;
    const offset = owner.width / 1.5;
    
    const baseAngle = owner.isAiming ? owner.aimAngle : (owner.facing === 1 ? 0 : Math.PI);
    
    // Spawn point resolution
    const startX = cx + Math.cos(baseAngle) * offset;
    const startY = cy + Math.sin(baseAngle) * offset;

    // Create Projectile (Fireball class handles its own jitter/inaccuracy algorithm internally)
    const fireball = new Fireball(startX, startY, baseAngle, owner);

    this.currentCooldown = this.maxCooldown;
    return fireball;
  }

  /**
   * Delegates UI rendering directly to the static method on the Fireball projectile class, 
   * ensuring visual consistency between the HUD and the physical object.
   * * @override
   */
  drawIcon(ctx, x, y, size) {
    Fireball.drawIcon(ctx, x, y, size);
  }
}
