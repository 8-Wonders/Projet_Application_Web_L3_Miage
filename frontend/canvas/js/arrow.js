import { tilesTypes } from "./map.js";

export class Arrow {
  // CHANGED: Constructor now takes an angle instead of direction
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 10;
    this.width = 20;
    this.height = 4;
    this.active = true;

    // Calculate velocity based on angle
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  update(map) {
    // 1. Move the arrow
    this.x += this.vx;
    this.y += this.vy;

    // 2. Calculate Map Boundaries (for off-screen check)
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize;

    // 3. CHECK TILE COLLISION
    // Convert pixel coordinates (x, y) to grid coordinates (col, row)
    const gridCol = Math.floor(this.x / map.tileSize);
    const gridRow = Math.floor(this.y / map.tileSize);

    // Get the tile ID at this position
    const tileID = map.getTile(gridCol, gridRow);

    // Check for Stone (1) or Brick (2)
    if (tileID === tilesTypes.stone || tileID === tilesTypes.brick) {
      this.active = false; // Destroy arrow
    }

    // 4. Deactivate if off-screen
    if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle); // Rotate the rectangle to match flight path
    ctx.fillStyle = "red";
    // Draw centered at x,y
    ctx.fillRect(0, -this.height / 2, this.width, this.height);
    ctx.restore();
  }
}
