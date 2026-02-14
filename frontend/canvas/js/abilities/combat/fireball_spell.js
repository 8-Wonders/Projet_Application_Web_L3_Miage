import { Ability } from "../ability.js";
import { Fireball } from "../../projectiles/fireball.js";

export class FireballSpell extends Ability {
  constructor() {
    super("Fireball", 2, "orange"); // 2 turn cooldown
  }

  activate(owner, context) {
    if (!this.canActivate()) return null;

    const cx = owner.x + owner.width / 2;
    const cy = owner.y + owner.height / 2;
    const offset = owner.width / 1.5;
    
    const baseAngle = owner.isAiming ? owner.aimAngle : (owner.facing === 1 ? 0 : Math.PI);
    
    // Spawn point
    const startX = cx + Math.cos(baseAngle) * offset;
    const startY = cy + Math.sin(baseAngle) * offset;

    // Create Projectile (Fireball class handles its own jitter/inaccuracy)
    const fireball = new Fireball(startX, startY, baseAngle, owner);

    this.currentCooldown = this.maxCooldown;
    return fireball;
  }

  drawIcon(ctx, x, y, size) {
    Fireball.drawIcon(ctx, x, y, size);
  }
}
