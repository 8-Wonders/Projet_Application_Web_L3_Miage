import { Projectile } from "./projectile.js";
import { handleMovement, handleAiming } from "./input.js";

export class Player {
  constructor(x, y, w, h, color, health = 100) {
    // Physics & Dimensions
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;

    // Stats
    this.health = health;
    this.maxHealth = health;
    this.damage = 30; // Base damage

    // Movement Stats
    this.speed = 5;
    this.jumpStrength = 15;
    this.gravity = 0.8;
    this.dy = 0;

    // State
    this.grounded = false;
    this.facing = 1; // 1 = Right, -1 = Left
    this.turnActive = false; // Is it currently this player's turn?
    this.hasFired = false; // Has the player shot this turn?

    // Aiming
    this.isAiming = false;
    this.aimAngle = 0;
    this.aimRotationSpeed = 0.05;

    // Entities
    this.projectiles = [];
  }

  // ============================
  // CORE LOOP (Update & Draw)
  // ============================

  move(keys, map, players) {
    // Only allow control if it is this player's turn
    if (!this.turnActive) {
      this.updateProjectiles(map, players); // Still update physics for existing projectiles
      return;
    }

    // 1. Handle Player State
    if (this.isAiming) {
      handleAiming(this, keys);
      // While aiming, we do NOT call handleMovement (locks position)
    } else {
      // Can only move if not aiming
      handleMovement(this, keys, map);
    }

    // 2. Handle Projectiles
    this.updateProjectiles(map, players);
  }

  draw(ctx) {
    // Draw Player
    // Change color if it is NOT this player's turn to indicate waiting
    ctx.fillStyle = this.turnActive 
      ? (this.isAiming ? "darkblue" : this.color) 
      : "gray";
    
    ctx.fillRect(this.x, this.y, this.w, this.h);

    this.drawHealthBar(ctx);

    // Draw UI/Effects
    if (this.isAiming && this.turnActive) {
      this.drawAimLine(ctx);
    }

    // Draw Projectiles
    this.projectiles.forEach((p) => p.draw(ctx));
  }

  drawHealthBar(ctx) {
    const barWidth = this.w;
    const barHeight = 6;
    const x = this.x;
    const y = this.y - 15; // Position above character

    // Background (Red/Empty)
    ctx.fillStyle = "red";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Foreground (Green/Health)
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = "green";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    console.log(`Player took ${amount} damage. Health: ${this.health}`);
  }

  // ============================
  // INPUT HANDLERS
  // ============================

  startTurn() {
    this.turnActive = true;
    this.hasFired = false;
    this.isAiming = false;
  }

  endTurn() {
    this.turnActive = false;
    this.isAiming = false;
  }

  toggleAim() {
    if (!this.turnActive || this.hasFired) return;

    this.isAiming = !this.isAiming;
    if (this.isAiming) {
      // Reset angle to match direction immediately
      this.aimAngle = this.facing === 1 ? 0 : Math.PI;
    }
  }

  shoot() {
    if (!this.turnActive || this.hasFired) return false;

    const centerX = this.x + this.w / 2;
    const centerY = this.y + this.h / 2;

    // Use aim angle if aiming, otherwise shoot straight
    const angle = this.isAiming
      ? this.aimAngle
      : this.facing === 1
        ? 0
        : Math.PI;

    const offset = this.w / 1.5;
    const startX = centerX + Math.cos(angle) * offset;
    const startY = centerY + Math.sin(angle) * offset;

    this.projectiles.push(new Projectile(startX, startY, angle, this, this.damage));
    
    // Turn Logic: Shot fired, mark as done
    this.hasFired = true;
    this.isAiming = false; // Exit aiming state
    
    return true; // Signal that a shot occurred
  }

  // ============================
  // HELPERS (Collision & Updates)
  // ============================

  updateProjectiles(map, players) {
    this.projectiles.forEach((p) => p.update(map, players));
    this.projectiles = this.projectiles.filter((p) => p.active);
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
