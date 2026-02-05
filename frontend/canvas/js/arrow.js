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

  update(mapWidth, mapHeight) {
    // CHANGED: Move using velocity vectors
    this.x += this.vx;
    this.y += this.vy;

    // Deactivate if off-screen (checking X and Y now)
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
