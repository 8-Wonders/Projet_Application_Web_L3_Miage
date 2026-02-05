import { Arrow } from "./arrow.js"; // Import the new class

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

    // NEW: Shooting mechanics
    this.facing = 1; // 1 = Right, -1 = Left
    this.arrows = [];
  }

  draw(ctx) {
    // Draw the Player
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // NEW: Draw Aim Line
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const aimLength = 100;

    ctx.beginPath();
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 2;
    ctx.moveTo(centerX, centerY);
    // Draw line based on facing direction
    ctx.lineTo(centerX + (aimLength * this.facing), centerY);
    ctx.stroke();

    // NEW: Draw Arrows
    this.arrows.forEach(arrow => arrow.draw(ctx));
  }

  move(keys, map) {
    // Horizontal movement
    if (keys["ArrowLeft"]) {
      this.x -= this.speed;
      this.facing = -1; // Update direction
    }
    if (keys["ArrowRight"]) {
      this.x += this.speed;
      this.facing = 1; // Update direction
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
    this.grounded = false;
    this.checkCollision(map, "y");

    // Fallback for bottom boundary
    const mapHeight = map.level.length * map.tileSize;
    if (this.y + this.h > mapHeight) {
      this.y = mapHeight - this.h;
      this.dy = 0;
      this.grounded = true;
    }

    // NEW: Update Arrows
    // Filter out inactive arrows (off-screen)
    const mapWidth = map.level[0].length * map.tileSize;
    this.arrows.forEach(arrow => arrow.update(mapWidth));
    this.arrows = this.arrows.filter(arrow => arrow.active);
  }

  // NEW: Shoot method
  shoot() {
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    
    // Spawn arrow slightly in front of player so it doesn't overlap weirdly
    const startX = centerX + (this.w / 2 * this.facing);
    
    this.arrows.push(new Arrow(startX, centerY, this.facing));
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
              this.x = col * map.tileSize - this.w;
            } else {
              this.x = (col + 1) * map.tileSize;
            }
          } else {
            if (this.dy > 0) {
              this.y = row * map.tileSize - this.h;
              this.dy = 0;
              this.grounded = true;
            } else if (this.dy < 0) {
              this.y = (row + 1) * map.tileSize;
              this.dy = 0;
            }
          }
        }
      }
    }
  }
}
