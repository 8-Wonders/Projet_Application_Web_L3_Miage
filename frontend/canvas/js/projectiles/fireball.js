import { Projectile } from "./projectile.js";

export class Fireball extends Projectile {
  constructor(x, y, angle, owner) {
    // Add inaccuracy here or in the Spell ability. 
    // Adding it here ensures even "raw" fireballs wobble.
    const inaccuracy = (Math.random() - 0.5) * 0.3; 
    
    super(x, y, angle + inaccuracy, owner, 40); 

    this.diameter = 30;
    this.color = "orange";
    this.speed = 8;
    this.knockback = 4.0; 

    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.maxDistance = 200; 
    this.traveled = 0;
  }

  updatePhysics() {
    // Visual Jitter
    const jitter = 4;
    this.y += (Math.random() - 0.5) * jitter;
    this.x += (Math.random() - 0.5) * jitter;

    super.updatePhysics();

    // Range Check
    const step = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.traveled += step;

    if (this.traveled > this.maxDistance) {
      this.active = false; 
    }
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);

    // Scale down as it dies
    const lifeRatio = 1 - (this.traveled / this.maxDistance);
    const scale = Math.max(0.5, lifeRatio);
    ctx.scale(scale, scale);

    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(0, 0, this.diameter, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(0, 0, this.diameter / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "darkred";
    ctx.fillRect(x, y, size, size);

    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/6, 0, Math.PI * 2);
    ctx.fill();
  }
}
