/**
 * @module ability
 * @description Defines the abstract base class and polymorphic contract for all executable character actions.
 * Implements a Command-like pattern where actions are decoupled from the input/entity logic, 
 * encapsulating their own cooldown lifecycles, execution contexts, and UI rendering rules.
 */

export class Ability {
  /**
   * Initializes a generic ability schema.
   * * @param {string} name - The logical and display name for UI/Debugging purposes.
   * @param {number} [cooldown=0] - The required number of turns/ticks before the ability can be re-executed.
   * @param {string} [iconColor="white"] - Fallback CSS color string for generic UI rendering.
   */
  constructor(name, cooldown = 0, iconColor = "white") {
    this.name = name;
    this.maxCooldown = cooldown;
    this.currentCooldown = 0;
    this.iconColor = iconColor;
  }

  /**
   * Primary execution hook. Subclasses MUST override this method to inject specific game logic.
   * * @param {Player} owner - The entity context executing the ability.
   * @param {Object} context - The environmental context payload.
   * @param {Map} context.map - The spatial terrain grid.
   * @param {Array<Player>} context.players - The global entity registry.
   * @param {Object} context.mouse - Current absolute mouse coordinates (x, y).
   * @returns {Projectile|null} Returns an instantiated Projectile for the engine to manage, 
   * or null if the ability resulted in an instantaneous state mutation.
   */
  activate(owner, context) {
    console.warn(`${this.name} has no activate logic.`);
    return null;
  }

  /**
   * Step function invoked by the TurnManager at the start of the owner's phase 
   * to decrement the cooldown lock.
   */
  updateCooldown() {
    if (this.currentCooldown > 0) {
      this.currentCooldown--;
    }
  }

  /**
   * Evaluates the availability state of the command.
   * * @returns {boolean} True if the ability is off cooldown and ready for execution.
   */
  canActivate() {
    return this.currentCooldown === 0;
  }

  /**
   * Immediate-mode rendering fallback for the HUD hotbar.
   * Expected to be overridden by subclasses or deferred to static Projectile methods.
   * * @param {CanvasRenderingContext2D} ctx - Active drawing context.
   * @param {number} x - Absolute top-left X coordinate of the UI slot.
   * @param {number} y - Absolute top-left Y coordinate of the UI slot.
   * @param {number} size - The uniform width/height of the UI slot.
   */
  drawIcon(ctx, x, y, size) {
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, size, size);
    
    // Default Fallback: Renders the first character of the ability name
    ctx.fillStyle = this.iconColor;
    ctx.font = `${size/1.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.name.charAt(0), x + size/2, y + size/2);
  }
}
