import { tilesTypes } from "../map.js";
import { GraphicalObject } from "../graphical_object.js";

/**
 * Base class for all moving objects fired by players.
 * Handles basic movement (velocity), boundary checks, and collision with the map/players.
 */
export class Projectile extends GraphicalObject {
  /**
   * @param {number} x - Starting X coordinate
   * @param {number} y - Starting Y coordinate
   * @param {number} angle - Firing angle in radians
   * @param {Object} owner - The Player instance who fired this
   * @param {number} damage - Base damage dealt on impact
   */
  constructor(x, y, angle, owner, damage = 30) {
    // Initialize graphical properties (yellow square by default)
    super(x, y, 10, 10, "yellow");
    
    this.owner = owner;
    this.damage = damage;
    this.angle = angle;
    this.active = true; // If false, game loop removes this projectile
    
    // Physics defaults
    this.speed = 10;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.knockback = 0; // Force to push target back
  }

  update(map, players) {
    if (!this.active) return;

    this.updatePhysics();
    this.checkCollisions(map, players);
  }

  /**
   * Updates position based on velocity.
   * Can be overridden by subclasses for gravity or wind effects.
   */
  updatePhysics() {
    this.x += this.vx;
    this.y += this.vy;
  }

  /**
   * Core collision logic.
   * Checks 1. Map Boundaries, 2. Solid Tiles, 3. Enemy Players.
   */
  checkCollisions(map, players) {
    // --- 1. Map Boundaries ---
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize;

    if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
      this.active = false;
      return;
    }

    // --- 2. Terrain Collision ---
    const gridCol = Math.floor(this.x / map.tileSize);
    const gridRow = Math.floor(this.y / map.tileSize);
    const tileID = map.getTile(gridCol, gridRow);

    // Stop if we hit a solid wall (Stone or Brick)
    if (tileID === tilesTypes.stone || tileID === tilesTypes.brick) {
      this.active = false;
      return;
    }

    // --- 3. Player/Entity Collision ---
    players.forEach((player) => {
      // Don't hit yourself or dead people
      if (player !== this.owner && player.health > 0) {
        
        // AABB (Axis-Aligned Bounding Box) Overlap Check
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

  /**
   * Helper to apply effects when a player is hit.
   */
  _handleImpact(target) {
    target.takeDamage(this.damage);
    
    if (this.knockback > 0) {
      // Push target in the direction of the projectile's velocity
      // Y-force is usually negative to pop them up into the air slightly
      target.applyKnockback(this.vx * 0.5 * this.knockback, -5); 
    }
    
    this.active = false; // Destroy projectile
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
   * Static method to draw an icon for the UI.
   * Meant to be overridden by subclasses for custom icons.
   */
  static drawIcon(ctx, x, y, size) {
    // Default: simple yellow box
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "yellow";
    ctx.fillRect(x + size/4, y + size/4, size/2, size/2);
  }
}
