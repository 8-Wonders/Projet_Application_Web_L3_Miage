import { Arrow } from "./arrow.js";

export class Spear extends Arrow {
  constructor(x, y, angle, owner) {
    super(x, y, angle, owner);
    
    this.damage = 35;
    this.width = 50;  
    this.height = 5;  
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Dark Wood Shaft
    ctx.fillStyle = "#5D4037"; 
    ctx.fillRect(0, -2, this.width, 4);
    
    // Silver Tip
    ctx.fillStyle = "#BDC3C7"; 
    ctx.beginPath();
    ctx.moveTo(this.width + 10, 0); 
    ctx.lineTo(this.width - 5, -5); 
    ctx.lineTo(this.width - 5, 5);  
    ctx.fill();
    
    // Red Decoration
    ctx.fillStyle = "#C0392B";
    ctx.fillRect(this.width - 8, -3, 4, 6);

    ctx.restore();
  }
}
