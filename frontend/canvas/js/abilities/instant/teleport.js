/**
 * @module teleport
 * @description Immediate-execution spatial manipulation ability. 
 * Bypasses the projectile physics engine entirely to mutate the entity's positional vectors.
 */

import { Ability } from "../ability.js";

/**
 * Executes an instantaneous coordinate translation based on global mouse input.
 * * @extends Ability
 */
export class TeleportAbility extends Ability {
  /**
   * Configures the teleport with a severe 5-turn cooldown to balance map traversal.
   */
  constructor() {
    super("Teleport", 5, "#4B0082"); // 5 turn cooldown
  }

  /**
   * Translates the owner entity directly to the targeted coordinates, 
   * neutralizing active momentum vectors to prevent sliding.
   * * @override
   * @returns {null} Always returns null as no deferred physics object is generated.
   */
  activate(owner, context) {
    if (!this.canActivate()) return null;

    // Extract the global cursor coordinates provided by the engine's IO pipeline
    const { mouse } = context;

    // Apply offset to ensure the destination coordinate represents the center-mass of the player hitbox
    const destX = mouse.x - owner.width / 2;
    const destY = mouse.y - owner.height / 2;

    // Immediate state mutation
    owner.x = destX;
    owner.y = destY;
    owner.vx = 0; // Strip horizontal inertia
    owner.dy = 0; // Strip vertical momentum
    owner.grounded = false; // Strip grounded flag to force gravity re-evaluation by the physics step

    this.currentCooldown = this.maxCooldown;
    return null;
  }

  /**
   * * @override
   */
  drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#4B0082"; // Indigo
    ctx.fillRect(x, y, size, size);

    // Portal Spiral Motif
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/4, 0, Math.PI * 2);
    ctx.stroke();
  }
}
