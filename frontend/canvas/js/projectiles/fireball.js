/**
 * @module fireball
 * @description Magic-based projectile featuring stochastic trajectory jitter, 
 * pronounced momentum transfer (knockback), and distance-based dissipation.
 */

import { Projectile } from "./projectile.js";

/**
 * * @extends Projectile
 */
export class Fireball extends Projectile {
  /**
   * * @param {number} x 
   * @param {number} y 
   * @param {number} angle 
   * @param {Player} owner 
   */
  constructor(x, y, angle, owner) {
    // Inject deterministic inaccuracy upon instantiation
    // Ensures even "raw" fireballs wobble slightly off the perfect trajectory
    const inaccuracy = (Math.random() - 0.5) * 0.3; 
    
    super(x, y, angle + inaccuracy, owner, 40); 

    this.diameter = 30;
    this.color = "orange";
    this.speed = 8;
    this.knockback = 4.0; 

    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;

    // Defines maximum functional range before the spell fizzles
    this.maxDistance = 200; 
    this.traveled = 0;
  }

  /**
   * Modifies the physics step to include artificial turbulence (jitter) and tracks 
   * Euclidean distance traveled to enforce the maximum range cap.
   * * @override
   */
  updatePhysics() {
    // Visual and spatial Jitter (Random walk approximation)
    const jitter = 4;
    this.y += (Math.random() - 0.5) * jitter;
    this.x += (Math.random() - 0.5) * jitter;

    super.updatePhysics();

    // Range Check (Pythagorean theorem on velocity vector per frame)
    const step = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.traveled += step;

    if (this.traveled > this.maxDistance) {
      this.active = false; 
    }
  }

  /**
   * Evaluates the projectile's remaining lifespan and applies a dynamic scale transformation,
   * simulating the fireball shrinking as its energy dissipates over distance.
   * * @override
   */
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);

    // Scale down as it approaches maximum range limits (capping at 50% size)
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

  /**
   * * @override
   */
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
