import { Arrow } from "./arrow.js";

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

    this.facing = 1; 
    this.arrows = [];

    // Aiming variables
    this.isAiming = false;
    this.aimAngle = 0; // Radians
    this.aimRotationSpeed = 0.05; 
  }

  toggleAim() {
    this.isAiming = !this.isAiming;
    
    // When entering aim mode, reset angle to current facing direction
    if (this.isAiming) {
        this.aimAngle = this.facing === 1 ? 0 : Math.PI;
    }
  }

  draw(ctx) {
    // Draw the Player
    ctx.fillStyle = this.color;
    // Visual cue: Change color slightly if aiming
    if(this.isAiming) ctx.fillStyle = "darkblue";
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // CHANGED: Only draw the aim line if we are actually aiming
    if (this.isAiming) {
        const centerX = this.x + this.w / 2;
        const centerY = this.y + this.h / 2;
        const aimLength = 100;

        const endX = centerX + Math.cos(this.aimAngle) * aimLength;
        const endY = centerY + Math.sin(this.aimAngle) * aimLength;

        ctx.beginPath();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }

    // Draw Arrows
    this.arrows.forEach(arrow => arrow.draw(ctx));
  }

  move(keys, map) {
    if (this.isAiming) {
        this.handleAiming(keys);
    } else {
        this.handleMovement(keys, map);
    }

    // Update Arrows (Always happens regardless of mode)
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize; 
    
    this.arrows.forEach(arrow => arrow.update(mapWidth, mapHeight));
    this.arrows = this.arrows.filter(arrow => arrow.active);
  }

  handleAiming(keys) {
    // Determine if we are generally aiming Left or Right
    // Cosine is negative on the left side (90 to 270 degrees)
    const isFacingLeft = Math.cos(this.aimAngle) < 0;
    
    // If facing left, we invert the rotation direction so "Up" still moves the aim line Up
    const direction = isFacingLeft ? -1 : 1;

    // Up moves angle Counter-Clockwise (Negative Radians) normally
    if (keys["ArrowUp"]) {
        this.aimAngle -= this.aimRotationSpeed * direction;
    }
    // Down moves angle Clockwise (Positive Radians) normally
    if (keys["ArrowDown"]) {
        this.aimAngle += this.aimRotationSpeed * direction;
    }
    
    // CHANGED: Left immediately points Left (PI)
    if (keys["ArrowLeft"]) {
       this.aimAngle = Math.PI; 
    }
    // CHANGED: Right immediately points Right (0)
    if (keys["ArrowRight"]) {
       this.aimAngle = 0;
    }
  }

  handleMovement(keys, map) {
    if (keys["ArrowLeft"]) {
      this.x -= this.speed;
      this.facing = -1;
    }
    if (keys["ArrowRight"]) {
      this.x += this.speed;
      this.facing = 1;
    }

    this.checkCollision(map, "x");

    if ((keys["ArrowUp"] || keys[" "]) && this.grounded) {
      this.dy = -this.jumpStrength;
      this.grounded = false;
    }

    this.dy += this.gravity;
    this.y += this.dy;

    this.grounded = false;
    this.checkCollision(map, "y");

    const mapHeight = map.level.length * map.tileSize;
    if (this.y + this.h > mapHeight) {
      this.y = mapHeight - this.h;
      this.dy = 0;
      this.grounded = true;
    }
  }

  shoot() {
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    
    let angle;
    if (this.isAiming) {
        angle = this.aimAngle;
    } else {
        angle = this.facing === 1 ? 0 : Math.PI;
    }

    const startX = centerX + Math.cos(angle) * (this.w/1.5);
    const startY = centerY + Math.sin(angle) * (this.w/1.5);
    
    this.arrows.push(new Arrow(startX, startY, angle));
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
