import { Arrow } from "./arrow.js";
import { handleMovement, handleAiming } from "./input.js";

export class Player {
  constructor(x, y, w, h, color) {
    // Physics & Dimensions
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;

    // Movement Stats
    this.speed = 5;
    this.jumpStrength = 15;
    this.gravity = 0.8;
    this.dy = 0;

    // State
    this.grounded = false;
    this.facing = 1; // 1 = Right, -1 = Left

    // Aiming
    this.isAiming = false;
    this.aimAngle = 0;
    this.aimRotationSpeed = 0.05;

    // Entities
    this.arrows = [];
  }

  // ============================
  // CORE LOOP (Update & Draw)
  // ============================

  move(keys, map) {
    // 1. Handle Player State
    if (this.isAiming) {
      handleAiming(this, keys);
    } else {
      handleMovement(this, keys, map);
    }

    // 2. Handle Projectiles
    this.updateArrows(map);
  }

  draw(ctx) {
    // Draw Player
    ctx.fillStyle = this.isAiming ? "darkblue" : this.color;
    ctx.fillRect(this.x, this.y, this.w, this.h);

    // Draw UI/Effects
    if (this.isAiming) {
      this.drawAimLine(ctx);
    }

    // Draw Projectiles
    this.arrows.forEach((arrow) => arrow.draw(ctx));
  }

  // ============================
  // INPUT HANDLERS
  // ============================

  toggleAim() {
    this.isAiming = !this.isAiming;
    if (this.isAiming) {
      // Reset angle to match direction immediately
      this.aimAngle = this.facing === 1 ? 0 : Math.PI;
    }
  }

  shoot() {
    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;

    // Use aim angle if aiming, otherwise shoot straight
    const angle = this.isAiming
      ? this.aimAngle
      : this.facing === 1
        ? 0
        : Math.PI;

    // Spawn arrow slightly offset from center
    const offset = this.w / 1.5;
    const startX = centerX + Math.cos(angle) * offset;
    const startY = centerY + Math.sin(angle) * offset;

    this.arrows.push(new Arrow(startX, startY, angle));
  }

  // ============================
  // HELPERS (Collision & Updates)
  // ============================

  updateArrows(map) {
    // CHANGED: We now pass the entire 'map' object to the arrow
    this.arrows.forEach((arrow) => arrow.update(map));

    // Remove inactive arrows
    this.arrows = this.arrows.filter((arrow) => arrow.active);
  }

  drawAimLine(ctx) {
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
            // Horizontal Collision
            if (this.x < col * map.tileSize) {
              this.x = col * map.tileSize - this.w;
            } else {
              this.x = (col + 1) * map.tileSize;
            }
          } else {
            // Vertical Collision
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
