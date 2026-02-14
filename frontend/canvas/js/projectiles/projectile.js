import { tilesTypes } from "../map.js";
import { GraphicalObject } from "../graphical_object.js";

/**
 * Base class for all physical moving objects fired by players.
 * Handles movement, boundary checks, and collision.
 */
export class Projectile extends GraphicalObject {
  /**
   * @param {number} x - Starting X
   * @param {number} y - Starting Y
   * @param {number} angle - Trajectory angle in radians
   * @param {Player} owner - Who fired this
   * @param {number} damage - Base damage
   */
  constructor(x, y, angle, owner, damage = 30) {
    super(x, y, 10, 10, "yellow");
    
    this.owner = owner;
    this.damage = damage;
    this.angle = angle;
    this.active = true;
    
    // Physics defaults
    this.speed = 10;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.knockback = 0; 
  }

  update(map, players) {
    if (!this.active) return;
    this.updatePhysics();
    this.checkCollisions(map, players);
  }

  updatePhysics() {
    this.x += this.vx;
    this.y += this.vy;
  }

  checkCollisions(map, players) {
    // 1. Map Boundaries
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize;

    if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
      this.active = false;
      return;
    }

    // 2. Terrain (Solid Walls)
    const gridCol = Math.floor(this.x / map.tileSize);
    const gridRow = Math.floor(this.y / map.tileSize);
    const tileID = map.getTile(gridCol, gridRow);

    if (tileID === tilesTypes.stone || tileID === tilesTypes.brick) {
      this.active = false;
      return;
    }

    // 3. Players/Enemies
    players.forEach((player) => {
      if (player !== this.owner && player.health > 0) {
        if (
          this.x < player.x + player.width &&
          this.x + this.width > player.x &&
          this.y < player.y + player.height &&
          this.y + this.height > player.y
        ) {
            this._handleImpact(player);
        }
      }
    });
  }

  _handleImpact(target) {
    target.takeDamage(this.damage);
    
    if (this.knockback > 0) {
      // Knockback includes a slight vertical pop (-5)
      target.applyKnockback(this.vx * 0.5 * this.knockback, -5); 
    }
    
    this.active = false; 
  }

  draw(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.fillRect(0, -this.height / 2, this.width, this.height);
    ctx.restore();
  }

  /**
   * Static helper for the UI to draw the icon without instantiating the projectile.
   */
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "yellow";
    ctx.fillRect(x + size/4, y + size/4, size/2, size/2);
  }
}
