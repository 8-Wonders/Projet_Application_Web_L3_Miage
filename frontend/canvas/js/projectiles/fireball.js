import { Projectile } from "./projectile.js";

/**
 * A magical projectile used by the Mage.
 * Features: High damage, Knockback, Wobbly flight path, Limited range.
 */
export class Fireball extends Projectile {
  constructor(x, y, angle, owner) {
    // 1. Apply Inaccuracy: Add random deviation to the initial angle
    const inaccuracy = (Math.random() - 0.5) * 0.3; 
    
    super(x, y, angle + inaccuracy, owner, 40); // High damage

    this.diameter = 30;
    this.color = "orange";
    this.speed = 8;
    this.knockback = 4.0; // High knockback

    // Recalculate velocity with the specific fireball speed + inaccuracy
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    // Range Limiter Config
    this.maxDistance = 200; // Fizzles out after this many pixels
    this.traveled = 0;
  }

  updatePhysics() {
    // 1. Visual Jitter: Randomly shift X/Y slightly to simulate unstable magic
    const jitter = 4;
    this.y += (Math.random() - 0.5) * jitter;
    this.x += (Math.random() - 0.5) * jitter;

    // 2. Standard Movement
    this.x += this.vx;
    this.y += this.vy;

    // 3. Range Check
    const step = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.traveled += step;

    if (this.traveled > this.maxDistance) {
      this.active = false; // Fizzle out
    }
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);

    // Calculate scaling: Shrinks as it approaches max distance
    const lifeRatio = 1 - (this.traveled / this.maxDistance);
    const scale = Math.max(0.5, lifeRatio);
    ctx.scale(scale, scale);

    // Outer Flame
    ctx.fillStyle = "orange";
    ctx.beginPath();
    ctx.arc(0, 0, this.diameter, 0, Math.PI * 2);
    ctx.fill();

    // Inner Core
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(0, 0, this.diameter / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Static method for UI rendering
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "darkred";
    ctx.fillRect(x, y, size, size);

    // Draw little fireball
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
