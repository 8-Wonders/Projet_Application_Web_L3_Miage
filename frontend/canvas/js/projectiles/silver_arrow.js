/**
 * @module silver_arrow
 * @description Specialized ballistic asset. Showcases polymorphism and Runtime Type Identification (RTTI) 
 * to apply unique payload modifiers against designated entity archetypes (e.g., Bosses).
 */

import { Arrow } from "./arrow.js";

/**
 * * @extends Arrow
 */
export class SilverArrow extends Arrow {
  /**
   * * @param {number} x 
   * @param {number} y 
   * @param {number} angle 
   * @param {Player} owner 
   */
  constructor(x, y, angle, owner) {
    // 1. Inherit from standard Arrow archetype
    // Constructor delegates to Arrow, setting the baseline payload to 25.
    super(x, y, angle, owner);
    
    this.color = "silver";
    
    // We do NOT explicitly set this.damage here. 
    // It relies on dynamic scaling defined in the _handleImpact override.
  }

  /**
   * Overrides payload resolution. Identifies the target class constructor and scales 
   * damage accordingly (+100% vs Dragon, -50% vs standard entities).
   * * @override
   * @protected
   * @param {Player} target 
   */
  _handleImpact(target) {
    // 2. Identify Target via RTTI
    // Evaluates the constructor name (JS specific implementation of type-checking)
    const isDragon = target.constructor.name === "Dragon" || target.name === "Dragon";

    if (isDragon) {
        // Case A: Critical Multiplier
        // 25 * 2 = 50 Damage
        target.takeDamage(this.damage * 2); 
        console.log("Silver Arrow hit Dragon! Critical damage.");
    } else {
        // Case B: Ineffective Multiplier
        // 25 * 0.5 = 12.5 (Floored to 12)
        target.takeDamage(Math.floor(this.damage * 0.5));
        console.log("Silver Arrow ineffective against non-dragon.");
    }
    
    // Terminate lifecycle
    this.active = false;
  }

  /**
   * * @override
   */
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

  /**
   * * @override
   */
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
