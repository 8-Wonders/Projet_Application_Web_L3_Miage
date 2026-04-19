/**
 * @module graphical_object
 * @description Provides the foundational spatial and rendering architecture for all canvas-based entities.
 */

/**
 * Base class for any object rendered on the HTML5 canvas.
 * Encapsulates the core spatial properties (position, dimensions) and rendering logic.
 * Designed to be extended by more complex entities (e.g., Players, Projectiles, UI elements).
 */
export class GraphicalObject {
  /**
   * Constructs a new GraphicalObject instance.
   * * @param {number} x - The absolute horizontal coordinate of the object's origin (top-left).
   * @param {number} y - The absolute vertical coordinate of the object's origin (top-left).
   * @param {number} width - The total horizontal footprint of the object in pixels.
   * @param {number} height - The total vertical footprint of the object in pixels.
   * @param {string} color - The visual fill style. Accepts any valid CSS color string (e.g., hex code "#FF0000", rgb, or named color "red").
   */
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  /**
   * Executes the rendering pipeline for this object onto the provided canvas context.
   * Utilizes context state management (`save`/`restore`) to guarantee that local transformations 
   * (like translations) do not mutate the global rendering state for subsequent draw calls.
   * * @param {CanvasRenderingContext2D} ctx - The active 2D rendering context of the HTML canvas.
   */
  draw(ctx) {
    ctx.save(); // 1. Save current context state (origin, styles, etc.)
    
    // 2. Move origin to object's position (simplifies drawing logic)
    ctx.translate(this.x, this.y);
    
    ctx.fillStyle = this.color;
    ctx.fillRect(0, 0, this.width, this.height);
    
    ctx.restore(); // 3. Restore state so next object isn't affected
  }
}
