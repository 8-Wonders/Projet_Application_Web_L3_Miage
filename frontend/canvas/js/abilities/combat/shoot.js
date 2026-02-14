import { Ability } from "../ability.js";

/**
 * Generic ability to shoot standard projectiles (Arrows, Spears).
 */
export class ShootAbility extends Ability {
  /**
   * @param {string} name - "Shoot Arrow", "Throw Spear", etc.
   * @param {Class} ProjectileClass - The class reference (e.g. Arrow)
   * @param {number} cooldown 
   */
  constructor(name, ProjectileClass, cooldown = 0) {
    super(name, cooldown);
    this.ProjectileClass = ProjectileClass;
  }

  activate(owner, context) {
    // 1. Calculate Spawn Position
    // Same logic as your original Player.shoot()
    const cx = owner.x + owner.width / 2;
    const cy = owner.y + owner.height / 2;

    const angle = owner.isAiming
      ? owner.aimAngle
      : (owner.facing === 1 ? 0 : Math.PI);

    const offset = owner.width / 1.5;
    const startX = cx + Math.cos(angle) * offset;
    const startY = cy + Math.sin(angle) * offset;

    // 2. Create the Projectile
    const projectile = new this.ProjectileClass(startX, startY, angle, owner);

    // 3. Return it (Game loop will add it to the world)
    return projectile;
  }

  drawIcon(ctx, x, y, size) {
    // Delegate drawing to the Projectile class's static method
    if (this.ProjectileClass.drawIcon) {
      this.ProjectileClass.drawIcon(ctx, x, y, size);
    } else {
      super.drawIcon(ctx, x, y, size);
    }
  }
}
