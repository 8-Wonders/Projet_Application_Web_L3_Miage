import { Arrow } from "./arrow.js";

/**
 * A heavier version of the Arrow.
 * Inherits gravity logic from Arrow but has custom visuals and higher damage.
 */
export class Spear extends Arrow {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner);
    
    this.damage = 35; // Stronger than Arrow (25)
    
    // Visual: Long and thin
    this.width = 50;  
    this.height = 5;  
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // 1. Shaft (Dark Wood)
    ctx.fillStyle = "#5D4037"; 
    ctx.fillRect(0, -2, this.width, 4);
    
    // 2. Head (Silver Tip)
    ctx.fillStyle = "#BDC3C7"; 
    ctx.beginPath();
    ctx.moveTo(this.width + 10, 0); // Extended sharp tip
    ctx.lineTo(this.width - 5, -5); 
    ctx.lineTo(this.width - 5, 5);  
    ctx.fill();
    
    // 3. Decoration (Red binding near head)
    ctx.fillStyle = "#C0392B";
    ctx.fillRect(this.width - 8, -3, 4, 6);

    ctx.restore();
  }
}
