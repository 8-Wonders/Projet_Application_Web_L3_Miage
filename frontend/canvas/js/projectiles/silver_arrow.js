import { Arrow } from "./arrow.js";

/**
 * A special Arrow that deals bonus damage to Dragons.
 */
export class SilverArrow extends Arrow {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner);
    
    this.color = "silver"; // Visual distinction
    this.damage = 35;      // Slightly higher base damage than normal arrow
  }

  /**
   * Overrides collision logic to check for Dragons.
   */
  _handleImpact(target) {
    // Check if target is a Dragon
    // We check the constructor name or a property
    if (target.constructor.name === "Dragon" || target.name === "Dragon") {
        // Double Damage
        target.takeDamage(this.damage * 2); 
    } else {
        // Normal Damage
        target.takeDamage(this.damage);
    }
    
    // Apply minor knockback
    target.applyKnockback(this.vx * 0.2, -3);
    
    this.active = false;
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Silver glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = "cyan";

    // 1. Shaft (Silver)
    ctx.fillStyle = "#E0E0E0"; 
    ctx.fillRect(0, -1, this.width, 2);
    
    // 2. Head (Shiny Cyan/Silver)
    ctx.fillStyle = "#A0E0FF";
    ctx.beginPath();
    ctx.moveTo(this.width, 0);       
    ctx.lineTo(this.width - 8, -4);  
    ctx.lineTo(this.width - 8, 4);   
    ctx.fill();

    // 3. Fletching (Blue)
    ctx.fillStyle = "#00BFFF";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(8, -3);
    ctx.lineTo(8, 3);
    ctx.fill();

    ctx.restore();
  }

  // Static method for UI rendering
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#222";
    ctx.fillRect(x, y, size, size); // Dark BG

    ctx.strokeStyle = "silver";
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Diagonal line
    ctx.moveTo(x + 5, y + size - 5);
    ctx.lineTo(x + size - 5, y + 5);
    ctx.stroke();

    // Tip
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(x + size - 5, y + 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
