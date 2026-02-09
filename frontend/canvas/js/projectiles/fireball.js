import { Projectile } from "./projectile.js";

export class Fireball extends Projectile {
  constructor(x, y, angle, owner) {
    // Add random deviation to the initial angle
    const inaccuracy = (Math.random() - 0.5) * 0.3;
    super(x, y, angle + inaccuracy, owner, 40);

    this.diameter = 30;
    this.color = "orange";
    this.speed = 8;

    // Recalculate velocity based on the imprecise angle
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    this.knockback = 4.0;

    // Limit the distance traveled (4 tiles = 4 * 50px)
    this.maxDistance = 200;
    this.traveled = 0;
  }

  updatePhysics() {
    // Add jitter/wobble during flight
    const jitter = 4;
    this.y += (Math.random() - 0.5) * jitter;
    this.x += (Math.random() - 0.5) * jitter;

    // Standard movement
    this.x += this.vx;
    this.y += this.vy;

    // Track distance
    const step = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.traveled += step;

    // Fizzle out if max distance reached
    if (this.traveled > this.maxDistance) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Draw Fireball (Circle)
    // Scale size down as it nears end of life
    const lifeRatio = 1 - this.traveled / this.maxDistance;
    const scale = Math.max(0.5, lifeRatio);

    ctx.scale(scale, scale);

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
}
