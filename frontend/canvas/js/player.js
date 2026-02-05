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

    // NEW: Aiming variables
    this.isAiming = false;
    this.aimAngle = 0; // Radians
    this.aimRotationSpeed = 0.05; // Low number = "very controllable"
  }

  // NEW: Toggle function called by app.js
  toggleAim() {
    this.isAiming = !this.isAiming;
    
    // When entering aim mode, reset angle to current facing direction
    // 0 is Right, Math.PI is Left
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

    // Draw Aim Line
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;
    const aimLength = 100;

    // NEW: Calculate line end point
    // If aiming, use aimAngle. If moving, use default facing.
    let endX, endY;
    
    if (this.isAiming) {
        endX = centerX + Math.cos(this.aimAngle) * aimLength;
        endY = centerY + Math.sin(this.aimAngle) * aimLength;
    } else {
        endX = centerX + (aimLength * this.facing);
        endY = centerY;
    }

    ctx.beginPath();
    ctx.strokeStyle = this.isAiming ? "red" : "gray"; // Red line when aiming
    ctx.lineWidth = 2;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw Arrows
    this.arrows.forEach(arrow => arrow.draw(ctx));
  }

  move(keys, map) {
    // NEW: Branch logic based on state
    if (this.isAiming) {
        this.handleAiming(keys);
    } else {
        this.handleMovement(keys, map);
    }

    // Update Arrows (Always happens regardless of mode)
    const mapWidth = map.level[0].length * map.tileSize;
    const mapHeight = map.level.length * map.tileSize; // Need height for arrow bounds
    
    this.arrows.forEach(arrow => arrow.update(mapWidth, mapHeight));
    this.arrows = this.arrows.filter(arrow => arrow.active);
  }

  // NEW: Logic for Stationary Aiming
  handleAiming(keys) {
    // Up moves angle Counter-Clockwise (Negative Radians)
    if (keys["ArrowUp"]) {
        this.aimAngle -= this.aimRotationSpeed;
    }
    // Down moves angle Clockwise (Positive Radians)
    if (keys["ArrowDown"]) {
        this.aimAngle += this.aimRotationSpeed;
    }
    // Left moves angle towards PI
    if (keys["ArrowLeft"]) {
       this.aimAngle -= this.aimRotationSpeed; 
    }
    // Right moves angle towards 0
    if (keys["ArrowRight"]) {
       this.aimAngle += this.aimRotationSpeed;
    }
  }

  // Existing movement logic moved here
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
    
    // Determine angle: precise aim if aiming, or generic direction if running
    let angle;
    if (this.isAiming) {
        angle = this.aimAngle;
    } else {
        angle = this.facing === 1 ? 0 : Math.PI;
    }

    // Spawn arrow slightly offset so it doesn't clip inside player immediately
    const startX = centerX + Math.cos(angle) * (this.w/1.5);
    const startY = centerY + Math.sin(angle) * (this.w/1.5);
    
    this.arrows.push(new Arrow(startX, startY, angle));
  }

  checkCollision(map, axis) {
    // ... (This function remains exactly the same as your original code)
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
