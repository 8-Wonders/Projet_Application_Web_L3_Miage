/**
 * @module arrow
 * @description Standard ballistic projectile utilizing gravitational pull and dynamic vector rotation.
 */

import { Projectile } from "./projectile.js";

/**
 * Implements an arcing kinetic projectile.
 * * @extends Projectile
 */
export class Arrow extends Projectile {
  /**
   * * @param {number} x 
   * @param {number} y 
   * @param {number} angle 
   * @param {Player} owner 
   */
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner, 25);
    
    this.width = 40;
    this.height = 4;
    this.color = "brown";
    
    // Ballistic properties
    this.gravity = 0.25; 
    this.speed = 15; 
    
    // Recalculate with subclass-specific speed profile
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  /**
   * Intercepts the standard linear physics step to inject gravitational acceleration 
   * and dynamically adjusts the sprite's rotation to align with the velocity vector.
   * * @override
   */
  updatePhysics() {
    this.vy += this.gravity;
    super.updatePhysics();
    // Rotate to face trajectory using arc tangent of current velocity
    this.angle = Math.atan2(this.vy, this.vx);
  }

  /**
   * * @override
   */
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Shaft
    ctx.fillStyle = "brown";
    ctx.fillRect(0, -1, this.width, 2);
    
    // Head
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(this.width, 0);       
    ctx.lineTo(this.width - 8, -4);  
    ctx.lineTo(this.width - 8, 4);   
    ctx.fill();

    // Fletching
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -3);
    ctx.lineTo(8, 3);
    ctx.fill();

    ctx.restore();
  }

  /**
   * * @override
   */
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + size - 5);
    ctx.lineTo(x + size - 5, y + 5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + size - 5, y + 5);
    ctx.lineTo(x + size - 12, y + 5);
    ctx.lineTo(x + size - 5, y + 12);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}
