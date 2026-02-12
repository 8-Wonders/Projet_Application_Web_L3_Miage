import { Projectile } from "./projectile.js";
import { tilesTypes } from "../map.js";

export class DragonBreath extends Projectile {
  constructor(x, y, angle, owner) {
    // Base damage 0 because we calculate it dynamically
    super(x, y, angle, owner, 0); 
    
    this.startX = x;
    this.startY = y;
    this.speed = 9;
    this.width = 20;
    this.height = 20;
    this.color = "#E74C3C"; // Red-Orange
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    
    this.maxRange = 250; // Distance where damage drops off
  }

  // Override collision to implement "Closer = More Damage"
  checkCollisions(map, players) {
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize;

    // Boundaries
    if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
      this.active = false;
      return;
    }

    // Walls
    const gridCol = Math.floor(this.x / map.tileSize);
    const gridRow = Math.floor(this.y / map.tileSize);
    const tileID = map.getTile(gridCol, gridRow);

    if (tileID === tilesTypes.stone || tileID === tilesTypes.brick) {
      this.active = false;
      return;
    }

    // Players
    // Uses for...of to allow 'return' to exit the function immediately
    for (const player of players) {
      if (player !== this.owner && player.health > 0) {
        if (
          this.x < player.x + player.width &&
          this.x + this.width > player.x &&
          this.y < player.y + player.height &&
          this.y + this.height > player.y
        ) {
          // 1. Calculate Distance
          const dist = Math.hypot(this.x - this.startX, this.y - this.startY);
          
          // 2. Calculate Damage Factor
          // 100% damage at 0 distance, drops to 20% at maxRange
          let factor = 1 - (dist / this.maxRange);
          if (factor < 0.2) factor = 0.2; 

          const maxDamage = 55; 
          const finalDamage = Math.floor(maxDamage * factor);

          // 3. Apply Damage and Status
          player.takeDamage(finalDamage);
          player.applyStatus("BURNING", 3); // Burns for 3 turns

          this.active = false;
          return; // STOP checking other players to prevent issues
        }
      }
    }
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Visual: Fire Core
    ctx.fillStyle = "#C0392B"; // Dark Red
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F1C40F"; // Yellow Core
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
