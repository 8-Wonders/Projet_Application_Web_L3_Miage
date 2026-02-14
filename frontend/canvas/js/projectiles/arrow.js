import { Projectile } from "./projectile.js";

export class Arrow extends Projectile {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner, 25);
    
    this.width = 40;
    this.height = 4;
    this.color = "brown";
    
    this.gravity = 0.25; 
    this.speed = 15; 
    
    // Recalculate with new speed
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  updatePhysics() {
    this.vy += this.gravity;
    super.updatePhysics();
    // Rotate to face trajectory
    this.angle = Math.atan2(this.vy, this.vx);
  }

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
