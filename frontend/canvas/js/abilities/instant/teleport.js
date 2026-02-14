import { Ability } from "../ability.js";

export class TeleportAbility extends Ability {
  constructor() {
    super("Teleport", 5, "#4B0082"); // 5 turn cooldown
  }

  activate(owner, context) {
    if (!this.canActivate()) return null;

    const { mouse } = context;

    // Logic moved from the old Teleport Projectile
    const destX = mouse.x - owner.width / 2;
    const destY = mouse.y - owner.height / 2;

    // Immediate Move
    owner.x = destX;
    owner.y = destY;
    owner.vx = 0; 
    owner.dy = 0;
    owner.grounded = false;

    this.currentCooldown = this.maxCooldown;
    return null;
  }

  drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#4B0082"; // Indigo
    ctx.fillRect(x, y, size, size);

    // Portal Spiral
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/4, 0, Math.PI * 2);
    ctx.stroke();
  }
}
