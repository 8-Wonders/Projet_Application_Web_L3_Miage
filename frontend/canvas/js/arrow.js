export class Arrow {
  constructor(x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction; // 1 for right, -1 for left
    this.speed = 10;
    this.width = 20;
    this.height = 4;
    this.active = true; // Set to false to remove from game
  }

  update(mapWidth) {
    // Move straight (no gravity)
    this.x += this.speed * this.direction;

    // Deactivate if off-screen (simple cleanup)
    if (this.x < 0 || this.x > mapWidth) {
      this.active = false;
    }
  }

  draw(ctx) {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}
