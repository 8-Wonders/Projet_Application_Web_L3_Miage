/**
 * @module teleport
 * @description Implements an instantaneous spatial manipulation ability. 
 * Architecturally masquerades as a Projectile to conform to the unified hotbar array interface, 
 * but bypasses standard physics integration to execute an immediate state mutation on the owner.
 */

import { Projectile } from "./projectile.js";

/**
 * * @extends Projectile
 */
export class Teleport extends Projectile {
  /**
   * Executes the spatial translation immediately upon instantiation.
   * * @param {number} x - Origin X (not used for movement, required by parent contract)
   * @param {number} y - Origin Y (not used)
   * @param {number} angle - Unused for instant abilities.
   * @param {Player} owner - The entity executing the translation.
   * @param {number} targetX - Resolved absolute mouse X coordinate.
   * @param {number} targetY - Resolved absolute mouse Y coordinate.
   */
  constructor(x, y, angle, owner, targetX, targetY) {
    super(x, y, angle, owner, 0); // Initialize with 0 payload
    // Flagged false immediately; this entity will be garbage collected on the next frame loop.
    this.active = false; 

    // 1. Calculate Grid Coordinates of Target
    // Applies an offset to ensure the destination coordinate represents the center-mass of the player hitbox
    const destX = targetX - owner.width / 2;
    const destY = targetY - owner.height / 2;

    // 2. Execute Immediate State Mutation
    // Teleport injects the entity directly into the target coordinates.
    // Note: To prevent gridlock, we rely on the Player's subsequent native checkCollision() loop 
    // to eject the entity safely if they teleported into solid geometry.
    owner.x = destX;
    owner.y = destY;
    owner.vx = 0; // Strip horizontal inertia to prevent sliding out of teleport
    owner.dy = 0; // Strip vertical momentum
    owner.grounded = false; // Strip grounded flag to force gravity re-evaluation
  }

  /**
   * Overrides the lifecycle loop to guarantee this object processes 0 frames.
   * * @override
   * @param {Map} map 
   * @param {Array<Player>} players 
   */
  update(map, players) {
      this.active = false; 
  }

  /**
   * * @override
   */
  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#4B0082"; // Indigo
    ctx.fillRect(x, y, size, size);

    // Draw Spiral/Portal motif
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/4, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
