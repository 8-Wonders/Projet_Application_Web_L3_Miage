import { Arrow } from "./arrow.js";

export class Spear extends Arrow {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner);
    this.damage = 35; // Higher than Arrow (25), Lower than Fireball (40)
    
    // Visual adjustments
    this.width = 50;  // Longer shaft
    this.height = 5;  // Thicker
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // 1. Draw Spear Shaft (Darker Wood)
    ctx.fillStyle = "#5D4037"; 
    ctx.fillRect(0, -2, this.width, 4);
    
    // 2. Draw Spear Head (Silver Tip)
    ctx.fillStyle = "#BDC3C7"; // Silver
    ctx.beginPath();
    // Tip
    ctx.moveTo(this.width + 10, 0); 
    // Back corners
    ctx.lineTo(this.width - 5, -5); 
    ctx.lineTo(this.width - 5, 5);  
    ctx.fill();
    
    // 3. Red Binding/Decoration near the head
    ctx.fillStyle = "#C0392B";
    ctx.fillRect(this.width - 8, -3, 4, 6);

    ctx.restore();
  }
}
