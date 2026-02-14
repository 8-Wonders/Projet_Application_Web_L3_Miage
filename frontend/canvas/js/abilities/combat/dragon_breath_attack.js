import { Ability } from "../ability.js";
import { DragonBreath } from "../../projectiles/dragon_breath.js";

export class DragonBreathAttack extends Ability {
  constructor() {
    super("Dragon Breath", 4, "red"); // 4 turn cooldown
  }

  activate(owner, context) {
    if (!this.canActivate()) return null;

    const cx = owner.x + owner.width / 2;
    const cy = owner.y + owner.height / 2;
    const offset = owner.width / 1.5;
    const angle = owner.isAiming ? owner.aimAngle : (owner.facing === 1 ? 0 : Math.PI);

    const startX = cx + Math.cos(angle) * offset;
    const startY = cy + Math.sin(angle) * offset;

    // Create the breath projectile
    const breath = new DragonBreath(startX, startY, angle, owner);

    this.currentCooldown = this.maxCooldown;
    return breath;
  }
  
  // Custom Icon if DragonBreath doesn't have a static one
  drawIcon(ctx, x, y, size) {
     ctx.fillStyle = "#8B0000"; // Dark Red
     ctx.fillRect(x, y, size, size);
     ctx.fillStyle = "orange";
     ctx.beginPath();
     ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
     ctx.fill();
  }
}
