/**
 * @module shoot
 * @description A generic Factory adapter for ballistic abilities. 
 * Allows standard physics projectiles (Arrows, Spears) to interface with the Ability 
 * cooldown and hotbar system without requiring bespoke Ability subclasses for every weapon type.
 */

import { Ability } from "../ability.js";

/**
 * Generic ability wrapper to instantiate and fire standard physical projectiles.
 * * @extends Ability
 */
export class ShootAbility extends Ability {
  /**
   * Initializes the generic shooting factory.
   * * @param {string} name - Display name (e.g. "Shoot Arrow", "Throw Spear").
   * @param {Class} ProjectileClass - A reference to the uninstantiated Class (e.g., `Arrow`).
   * @param {number} [cooldown=0] - Required refresh ticks.
   */
  constructor(name, ProjectileClass, cooldown = 0) {
    super(name, cooldown);
    // Cache the class reference for dynamic instantiation during activation
    this.ProjectileClass = ProjectileClass;
  }

  /**
   * Evaluates the owner's trajectory state and dynamically instantiates the provided 
   * projectile class reference.
   * * @override
   */
  activate(owner, context) {
    // 1. Calculate Spawn Position (Center mass + radius offset)
    const cx = owner.x + owner.width / 2;
    const cy = owner.y + owner.height / 2;

    const angle = owner.isAiming
      ? owner.aimAngle
      : (owner.facing === 1 ? 0 : Math.PI);

    const offset = owner.width / 1.5;
    const startX = cx + Math.cos(angle) * offset;
    const startY = cy + Math.sin(angle) * offset;

    // 2. Create the Projectile via dynamic class instantiation
    const projectile = new this.ProjectileClass(startX, startY, angle, owner);

    // 3. Return it (The engine's main loop will append it to the world's physics queue)
    return projectile;
  }

  /**
   * Resolves the UI iconography. Prefers the static draw method of the assigned 
   * Projectile class, falling back to the base alphabetical square if undefined.
   * * @override
   */
  drawIcon(ctx, x, y, size) {
    // Delegate drawing to the Projectile class's static method
    if (this.ProjectileClass.drawIcon) {
      this.ProjectileClass.drawIcon(ctx, x, y, size);
    } else {
      super.drawIcon(ctx, x, y, size);
    }
  }
}
