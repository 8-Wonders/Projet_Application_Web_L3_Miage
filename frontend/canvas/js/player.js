export class Player {
  constructor(x, y, w, h, color) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
    this.speed = 5;
    this.dy = 0;
    this.jumpStrength = 15;
    this.gravity = 0.8;
    this.grounded = false;
  }

  static new() {
    return new Player(40, 100, 30, 10, "black");
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }

  move(keys, map) {
    // Horizontal movement
    if (keys["ArrowLeft"]) {
      this.x -= this.speed;
    }
    if (keys["ArrowRight"]) {
      this.x += this.speed;
    }

    // Horizontal collision
    this.checkCollision(map, "x");

    // Jump
    if ((keys["ArrowUp"] || keys[" "]) && this.grounded) {
      this.dy = -this.jumpStrength;
      this.grounded = false;
    }

    // Apply gravity
    this.dy += this.gravity;
    this.y += this.dy;

    // Vertical collision
    this.grounded = false; // Assume falling until collision proves otherwise
    this.checkCollision(map, "y");

    // Fallback for bottom boundary if map doesn't cover it (optional, but good for safety)
    if (this.y + this.h > map.level.length * map.tileSize) {
      this.y = map.level.length * map.tileSize - this.h;
      this.dy = 0;
      this.grounded = true;
    }
  }

  checkCollision(map, axis) {
    const startCol = Math.floor(this.x / map.tileSize);
    const endCol = Math.floor((this.x + this.w - 0.1) / map.tileSize);
    const startRow = Math.floor(this.y / map.tileSize);
    const endRow = Math.floor((this.y + this.h - 0.1) / map.tileSize);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = map.getTile(col, row);
        if (tile !== 0) {
          if (axis === "x") {
            if (this.x < col * map.tileSize) {
              // Moving Right
              this.x = col * map.tileSize - this.w;
            } else {
              // Moving Left
              this.x = (col + 1) * map.tileSize;
            }
          } else {
            if (this.dy > 0) {
              // Falling
              this.y = row * map.tileSize - this.h;
              this.dy = 0;
              this.grounded = true;
            } else if (this.dy < 0) {
              // Jumping
              this.y = (row + 1) * map.tileSize;
              this.dy = 0;
            }
          }
        }
      }
    }
  }
}
