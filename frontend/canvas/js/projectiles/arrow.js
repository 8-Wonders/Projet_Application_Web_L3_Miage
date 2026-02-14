import { Projectile } from "./projectile.js";

/**
 * A ballistic projectile affected by gravity.
 * Used by the Archer class.
 */
export class Arrow extends Projectile {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner, 25); // Lower base damage
    
    // Visuals
    this.width = 40;
    this.height = 4;
    this.color = "brown";
    
    // Physics
    this.gravity = 0.25; 
    this.speed = 15; // Fast initial speed
    
    // Recalculate velocity with new speed
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  /**
   * Overrides base physics to add gravity and rotation.
   */
  updatePhysics() {
    // Apply Gravity
    this.vy += this.gravity;
    
    // Standard movement
    super.updatePhysics();
    
    // Rotate the arrow to face its current direction of travel
    // (e.g., points down when falling)
    this.angle = Math.atan2(this.vy, this.vx);
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // 1. Shaft
    ctx.fillStyle = "brown";
    ctx.fillRect(0, -1, this.width, 2);
    
    // 2. Head (Gray Triangle)
    ctx.fillStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(this.width, 0);       // Tip
    ctx.lineTo(this.width - 8, -4);  // Top corner
    ctx.lineTo(this.width - 8, 4);   // Bottom corner
    ctx.fill();

    // 3. Fletching (White feathers at tail)
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -3);
    ctx.lineTo(8, 3);
    ctx.fill();

    ctx.restore();
  }

  // Static method for UI rendering
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(x, y, size, size);

    // Draw diagonal arrow
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + size - 5);
    ctx.lineTo(x + size - 5, y + 5);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(x + size - 5, y + 5);
    ctx.lineTo(x + size - 12, y + 5);
    ctx.lineTo(x + size - 5, y + 12);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}
