import { Projectile } from "./projectile.js";
import { tilesTypes } from "../map.js";

/**
 * A short-range area attack.
 * Unique mechanic: Damage decreases based on distance traveled.
 */
export class DragonBreath extends Projectile {
  constructor(x, y, angle, owner) {
    // Base damage is 0 because we calculate it dynamically on impact
    super(x, y, angle, owner, 0); 
    
    // Store spawn point to calculate distance traveled later
    this.startX = x;
    this.startY = y;
    
    this.speed = 9;
    this.width = 20;
    this.height = 20;
    this.color = "#E74C3C"; // Red-Orange
    
    // Recalculate velocity
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    
    this.maxRange = 250; // The point where damage hits minimum
  }

  /**
   * Overridden collision logic.
   * Instead of fixed damage, it calculates damage based on proximity to spawn.
   */
  checkCollisions(map, players) {
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize;

    // 1. Boundary Check
    if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
      this.active = false;
      return;
    }

    // 2. Wall Check
    const gridCol = Math.floor(this.x / map.tileSize);
    const gridRow = Math.floor(this.y / map.tileSize);
    const tileID = map.getTile(gridCol, gridRow);

    if (tileID === tilesTypes.stone || tileID === tilesTypes.brick) {
      this.active = false;
      return;
    }

    // 3. Entity Check
    for (const player of players) {
      if (player !== this.owner && player.health > 0) {
        // AABB Collision
        if (
          this.x < player.x + player.width &&
          this.x + this.width > player.x &&
          this.y < player.y + player.height &&
          this.y + this.height > player.y
        ) {
          
          // --- Custom Damage Logic ---
          
          // A. Calculate Distance Traveled
          const dist = Math.hypot(this.x - this.startX, this.y - this.startY);
          
          // B. Calculate Drop-off Factor (0.0 to 1.0)
          // At dist 0, factor is 1. At dist maxRange, factor is 0.
          let factor = 1 - (dist / this.maxRange);
          
          // Clamp minimum damage to 20%
          if (factor < 0.2) factor = 0.2; 

          const maxDamage = 55; 
          const finalDamage = Math.floor(maxDamage * factor);

          // C. Apply Effects
          player.takeDamage(finalDamage);
          player.applyStatus("BURNING", 3); // Unique status effect

          this.active = false;
          return; // Stop immediately after hitting one target
        }
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Draw Fire Core (Two circles for depth)
    ctx.fillStyle = "#C0392B"; // Dark Red Outer
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F1C40F"; // Yellow Inner
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
