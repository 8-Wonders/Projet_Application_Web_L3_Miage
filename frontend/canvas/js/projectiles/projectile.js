/**
 * @module projectile
 * @description Serves as the foundational base class for all transient, dynamic entities (spells, arrows, etc.).
 * Implements linear kinematics, spatial grid bounds checking, and Axis-Aligned Bounding Box (AABB) entity collision.
 */

import { tilesTypes } from "../map.js";
import { GraphicalObject } from "../graphical_object.js";

/**
 * Abstract physical manifestation of an attack or ability.
 * Managed by the Player's internal projectile array and automatically garbage-collected when inactive.
 * * @extends GraphicalObject
 */
export class Projectile extends GraphicalObject {
  /**
   * Initializes a physical entity within the game world.
   * * @param {number} x - Absolute X spawn coordinate (usually the emitter's center).
   * @param {number} y - Absolute Y spawn coordinate.
   * @param {number} angle - Initial trajectory vector expressed in radians.
   * @param {Player} owner - Reference to the emitting entity to prevent self-collision.
   * @param {number} [damage=30] - Base payload to apply to the target's health upon intersection.
   */
  constructor(x, y, angle, owner, damage = 30) {
    super(x, y, 10, 10, "yellow");
    
    this.owner = owner;
    this.damage = damage;
    this.angle = angle;
    // Lifecycle flag; once false, the entity is culled from the render/physics queue by the owner.
    this.active = true;
    
    // Physics defaults
    this.speed = 10;
    // Precompute velocity vector components based on the initial angle
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.knockback = 0; 
  }

  /**
   * Primary lifecycle hook invoked per frame by the entity manager.
   * * @param {Map} map - The global spatial grid.
   * @param {Array<Player>} players - Registry of all entities for intersection testing.
   */
  update(map, players) {
    if (!this.active) return;
    this.updatePhysics();
    this.checkCollisions(map, players);
  }

  /**
   * Integrates the velocity vector into the current spatial position.
   * Designed to be overridden by subclasses requiring complex kinematics (e.g., gravity, drag).
   */
  updatePhysics() {
    this.x += this.vx;
    this.y += this.vy;
  }

  /**
   * Executes continuous collision detection across map boundaries, static geometry, and dynamic entities.
   * * @param {Map} map - The map instance providing tile lookups.
   * @param {Array<Player>} players - Entity registry.
   */
  checkCollisions(map, players) {
    // 1. Map Boundaries (Cull projectiles exiting the viewport to prevent memory leaks)
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize;

    if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
      this.active = false;
      return;
    }

    // 2. Terrain / Static Geometry (Grid Lookup)
    const gridCol = Math.floor(this.x / map.tileSize);
    const gridRow = Math.floor(this.y / map.tileSize);
    const tileID = map.getTile(gridCol, gridRow);

    if (tileID === tilesTypes.stone || tileID === tilesTypes.brick) {
      this.active = false;
      return;
    }

    // 3. Dynamic Entities (AABB Intersection Testing)
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

  /**
   * Resolves the payload application upon confirming a valid entity intersection.
   * Applies raw damage and processes momentum transfer (knockback).
   * * @protected
   * @param {Player} target - The entity struck by this projectile.
   */
  _handleImpact(target) {
    target.takeDamage(this.damage);
    
    if (this.knockback > 0) {
      // Knockback includes a slight vertical pop (-5) to detach the target from ground friction
      target.applyKnockback(this.vx * 0.5 * this.knockback, -5); 
    }
    
    // Terminate lifecycle
    this.active = false; 
  }

  /**
   * Immediate-mode rendering step. Applies spatial translation and trajectory rotation.
   * * @param {CanvasRenderingContext2D} ctx - The active drawing context.
   */
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
   * Static helper for the UI manager. Renders the ability icon on the hotbar 
   * without requiring instantiation of the physics object.
   * * @param {CanvasRenderingContext2D} ctx 
   * @param {number} x 
   * @param {number} y 
   * @param {number} size 
   */
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "yellow";
    ctx.fillRect(x + size/4, y + size/4, size/2, size/2);
  }
}
