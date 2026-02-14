/**
 * Base class for all player actions (spells, attacks, buffs).
 */
export class Ability {
  /**
   * @param {string} name - Name for UI/Debugging
   * @param {number} cooldown - Turns required to recharge
   * @param {string} iconColor - Fallback color for UI icon
   */
  constructor(name, cooldown = 0, iconColor = "white") {
    this.name = name;
    this.maxCooldown = cooldown;
    this.currentCooldown = 0;
    this.iconColor = iconColor;
  }

  /**
   * Trigger the ability.
   * @param {Player} owner - The entity using the ability
   * @param {Object} context - { map, players, mouse }
   * @returns {Projectile|null} Returns a Projectile if one was fired, or null if instant.
   */
  activate(owner, context) {
    console.warn(`${this.name} has no activate logic.`);
    return null;
  }

  /**
   * Called at the start of a turn to lower cooldowns.
   */
  updateCooldown() {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }

  /**
   * Checks if ability is ready.
   */
  canActivate() {
    return this.currentCooldown === 0;
  }

  /**
   * Draw the icon for the UI. Can be overridden by subclasses.
   */
  drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, size, size);
    
    // Default: First letter of name
    ctx.fillStyle = this.iconColor;
    ctx.font = `${size/1.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.name.charAt(0), x + size/2, y + size/2);
  }
}
