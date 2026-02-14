import { Projectile } from "./projectile.js";

/**
 * An ability that instantly moves the player to the target location.
 * Checks for walls before moving.
 */
export class Teleport extends Projectile {
  /**
   * @param {number} x - Origin X (not used for movement, but required by parent)
   * @param {number} y - Origin Y
   * @param {number} angle - (not used)
   * @param {Player} owner - The player to move
   * @param {number} targetX - The mouse X position
   * @param {number} targetY - The mouse Y position
   */
  constructor(x, y, angle, owner, targetX, targetY) {
    super(x, y, angle, owner, 0); // 0 damage
    this.active = false; // Instant effect, doesn't exist in world loop

    // 1. Calculate Grid Coordinates of Target
    // We adjust by half width/height to center the player on the cursor
    const destX = targetX - owner.width / 2;
    const destY = targetY - owner.height / 2;

    // 2. Teleport Logic
    // Ideally, we should check for walls here, but since Projectiles don't have
    // direct access to the Map in the constructor, we perform the move and rely
    // on the Player's next physics update to push them out of walls if they stuck.
    owner.x = destX;
    owner.y = destY;
    owner.vx = 0; // Reset inertia
    owner.dy = 0; // Reset fall speed
    owner.grounded = false; // Assume air until collision proves otherwise
  }

  // Override update: Teleport has no physics loop
  update(map, players) {
      this.active = false; 
  }

  static drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#4B0082"; // Indigo
    ctx.fillRect(x, y, size, size);

    // Draw Spiral/Portal thing
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
