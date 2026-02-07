import { Projectile } from "./projectile.js";

export class Arrow extends Projectile {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner, 25); // Lower damage
    this.width = 40;
    this.height = 4;
    this.color = "brown";
    this.gravity = 0.25;
  }

  updatePhysics() {
    this.vy += this.gravity;
    super.updatePhysics();
    this.angle = Math.atan2(this.vy, this.vx);
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Draw Arrow Shaft
    ctx.fillStyle = "brown";
    ctx.fillRect(0, -1, this.width, 2);
    
    // Draw Arrow Head
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(this.width, 0);
    ctx.lineTo(this.width - 8, -4);
    ctx.lineTo(this.width - 8, 4);
    ctx.fill();

    // Fletching (Feathers) at the back
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -3);
    ctx.lineTo(8, 3);
    ctx.fill();

    ctx.restore();
  }
}
