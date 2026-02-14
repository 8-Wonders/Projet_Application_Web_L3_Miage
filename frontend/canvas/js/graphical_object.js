/**
 * Base class for any object rendered on the canvas.
 * Handles basic properties like position, dimensions, and color.
 */
export class GraphicalObject {
  /**
   * @param {number} x - Horizontal position
   * @param {number} y - Vertical position
   * @param {number} width - Object width
   * @param {number} height - Object height
   * @param {string} color - Hex code or color name (e.g., "#FF0000", "red")
   */
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }

  /**
   * Renders the object as a simple colored rectangle.
   * Uses context saving/restoring to isolate transformations.
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
