import { Arrow } from "./arrow.js";

export class SilverArrow extends Arrow {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner);
    this.color = "silver";
    this.damage = 35;
  }

  _handleImpact(target) {
    // Check if target is a Dragon (by class name or property)
    if (target.constructor.name === "Dragon" || target.name === "Dragon") {
        target.takeDamage(this.damage * 2); // Double Damage
    } else {
        target.takeDamage(this.damage);
    }
    
    target.applyKnockback(this.vx * 0.2, -3);
    this.active = false;
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = "cyan";

    // Silver Shaft
    ctx.fillStyle = "#E0E0E0"; 
    ctx.fillRect(0, -1, this.width, 2);
    
    // Cyan Tip
    ctx.fillStyle = "#A0E0FF";
    ctx.beginPath();
    ctx.moveTo(this.width, 0);       
    ctx.lineTo(this.width - 8, -4);  
    ctx.lineTo(this.width - 8, 4);   
    ctx.fill();

    // Blue Fletching
    ctx.fillStyle = "#00BFFF";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -3);
    ctx.lineTo(8, 3);
    ctx.fill();

    ctx.restore();
  }

  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#222";
    ctx.fillRect(x, y, size, size); 

    ctx.strokeStyle = "silver";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + size - 5);
    ctx.lineTo(x + size - 5, y + 5);
    ctx.stroke();

    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(x + size - 5, y + 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
