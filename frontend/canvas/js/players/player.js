import { Projectile } from "../projectiles/projectile.js";
import { handleMovement, handleAiming } from "../input.js";
import { tilesTypes } from "../map.js";
import { GraphicalObject } from "../graphical_object.js";

export class Player extends GraphicalObject {
  constructor(x, y, width, height, color, health = 100, maxMovement = 300) {
    super(x, y, width, height, color);

    // Stats
    this.health = health;
    this.maxHealth = health;
    this.damage = 30; // Base damage

    // Movement Stats
    this.speed = 5;
    this.vx = 0; // Velocity X for recoil/inertia
    this.jumpStrength = 15;
    this.gravity = 0.8;
    this.dy = 0;
    
    // Movement Limits
    this.maxMovement = maxMovement;
    this.distTraveled = 0;
    this.canMove = true;

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
    // Apply recoil/inertia regardless of turn status
    if (Math.abs(this.vx) > 0.1) {
      this.x += this.vx;
      this.vx *= 0.9; // Friction
      this.checkCollision(map, "x");
    } else {
      this.vx = 0;
    }

    // Only allow control if it is this player's turn
    if (!this.turnActive) {
      // Apply gravity/physics even when not turn (e.g. falling after recoil)
      handleMovement(this, {}, map);
      this.updateProjectiles(map, players); 
      return;
    }

    // 1. Handle Player State
    if (this.isAiming) {
      handleAiming(this, keys);
    } else {
      // Check if we can still move
      if (this.canMove) {
        // Pass map to handleMovement for standard input movement
        const moved = handleMovement(this, keys, map);
        this.distTraveled += moved;

        if (this.distTraveled >= this.maxMovement) {
          this.canMove = false;
          this.toggleAim(); // Force Aim Mode
        }
      } else {
        // Even if canMove is false, we need to apply gravity/physics (but no input movement)
        // We pass empty keys so gravity applies but no walking
        handleMovement(this, {}, map);
      }
    }

    // 2. Handle Projectiles
    this.updateProjectiles(map, players);
  }

  draw(ctx) {
    // Draw Player
    ctx.save();
    ctx.fillStyle = this.turnActive 
      ? (this.isAiming ? "darkblue" : this.color) 
      : "gray";
    
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();

    this.drawHealthBar(ctx);
    this.drawMovementBar(ctx);

    // Draw UI/Effects
    if (this.isAiming && this.turnActive) {
      this.drawAimLine(ctx);
    }

    // Draw Projectiles
    this.projectiles.forEach((p) => p.draw(ctx));
  }

  drawHealthBar(ctx) {
    ctx.save();
    const barWidth = this.width;
    const barHeight = 6;
    const x = this.x;
    const y = this.y - 15;

    ctx.fillStyle = "red";
    ctx.fillRect(x, y, barWidth, barHeight);

    const healthPercent = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = "green";
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
    ctx.restore();
  }

  drawMovementBar(ctx) {
    if (!this.turnActive) return;

    ctx.save();
    const barWidth = this.width;
    const barHeight = 4;
    const x = this.x;
    const y = this.y - 22; // Above health bar

    ctx.fillStyle = "gray";
    ctx.fillRect(x, y, barWidth, barHeight);

    const movePercent = Math.max(0, (this.maxMovement - this.distTraveled) / this.maxMovement);
    ctx.fillStyle = "cyan";
    ctx.fillRect(x, y, barWidth * movePercent, barHeight);
    ctx.restore();
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
  }
  
  applyKnockback(forceX, forceY) {
    this.vx += forceX;
    this.dy += forceY;
    this.grounded = false; // Lift off ground
  }

  // ============================
  // INPUT HANDLERS
  // ============================

  startTurn() {
    this.turnActive = true;
    this.hasFired = false;
    this.isAiming = false;
    this.distTraveled = 0;
    this.canMove = true;
  }

  endTurn() {
    this.turnActive = false;
    this.isAiming = false;
  }

  toggleAim() {
    if (!this.turnActive || this.hasFired) return;

    this.isAiming = !this.isAiming;
    if (this.isAiming) {
      this.aimAngle = this.facing === 1 ? 0 : Math.PI;
    }
  }

  createProjectile(x, y, angle) {
    return new Projectile(x, y, angle, this, this.damage);
  }

  shoot() {
    if (!this.turnActive || this.hasFired) return false;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    const angle = this.isAiming
      ? this.aimAngle
      : this.facing === 1
        ? 0
        : Math.PI;

    const offset = this.width / 1.5;
    const startX = centerX + Math.cos(angle) * offset;
    const startY = centerY + Math.sin(angle) * offset;

    this.projectiles.push(this.createProjectile(startX, startY, angle));
    
    this.hasFired = true;
    this.isAiming = false;
    
    return true;
  }

  // ============================
  // HELPERS (Collision & Updates)
  // ============================

  updateProjectiles(map, players) {
    this.projectiles.forEach((p) => p.update(map, players));
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  drawAimLine(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const aimLength = 100;

    const endX = centerX + Math.cos(this.aimAngle) * aimLength;
    const endY = centerY + Math.sin(this.aimAngle) * aimLength;

    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  }

  checkCollision(map, axis) {
    const startCol = Math.floor(this.x / map.tileSize);
    const endCol = Math.floor((this.x + this.width - 0.1) / map.tileSize);
    const startRow = Math.floor(this.y / map.tileSize);
    const endRow = Math.floor((this.y + this.height - 0.1) / map.tileSize);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = map.getTile(col, row);
        
        // Water Logic: Drowning (Instant Death)
        // We use 'return' to skip physical collision response, 
        // allowing the player to visually overlap with water while dying.
        if (tile === tilesTypes.water) {
            this.health = 0;
            return;
        }

        if (tile !== 0) {
          if (axis === "x") {
            if (this.x < col * map.tileSize) {
              this.x = col * map.tileSize - this.width;
            } else {
              this.x = (col + 1) * map.tileSize;
            }
          } else {
            if (this.dy > 0) {
              this.y = row * map.tileSize - this.height;
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