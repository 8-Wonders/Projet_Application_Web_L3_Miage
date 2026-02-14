import { Arrow } from "./arrow.js";

export class SilverArrow extends Arrow {
  constructor(x, y, angle, owner) {
    // 1. Inherit from Arrow
    // Arrow's constructor sets base damage to 25
    super(x, y, angle, owner);
    
    this.color = "silver";
    
    // We do NOT set this.damage = 35 anymore. 
    // It now uses the parent's base damage (25).
  }

  _handleImpact(target) {
    // 2. Identify Target
    // Checks class name or a specific 'name' property
    const isDragon = target.constructor.name === "Dragon" || target.name === "Dragon";

    if (isDragon) {
        // Case A: Dragon -> 100% More Damage (Double)
        // 25 * 2 = 50 Damage
        target.takeDamage(this.damage * 2); 
        console.log("Silver Arrow hit Dragon! Critical damage.");
    } else {
        // Case B: Non-Dragon -> 50% Less Damage (Half)
        // 25 * 0.5 = 12.5 (Floored to 12)
        target.takeDamage(Math.floor(this.damage * 0.5));
        console.log("Silver Arrow ineffective against non-dragon.");
    }
    
    // Destroy projectile
    this.active = false;
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Glow Effect
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
