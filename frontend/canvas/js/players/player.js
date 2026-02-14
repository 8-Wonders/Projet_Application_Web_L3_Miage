import { Projectile } from "../projectiles/projectile.js";
import { handleMovement, handleAiming } from "../input.js";
import { tilesTypes } from "../map.js";
import { GraphicalObject } from "../graphical_object.js";

/**
 * Core entity class. Handles physics, turn management, and rendering.
 * Inherited by specific classes like Archer, Mage, and Bot.
 */
export class Player extends GraphicalObject {
  constructor(x, y, width, height, color, health = 100, maxMovement = 300) {
    super(x, y, width, height, color);

    // --- Stats ---
    this.health = health;
    this.maxHealth = health;
    this.damage = 30; 

    // --- Physics ---
    this.speed = 5;
    this.vx = 0; // Horizontal inertia (for recoil/knockback)
    this.dy = 0; // Vertical velocity
    this.jumpStrength = 17;
    this.gravity = 0.8;
    this.grounded = false; // Is touching floor?

    // --- Turn Constraints ---
    this.maxMovement = maxMovement; // Max pixels traversable per turn
    this.distTraveled = 0;
    this.canMove = true;
    this.turnActive = false; // Is it currently this player's turn?
    this.hasFired = false;   // Turn ends after firing

    // --- Aiming ---
    this.facing = 1; // 1 = Right, -1 = Left
    this.isAiming = false;
    this.aimAngle = 0;
    this.aimRotationSpeed = 0.05;

    // --- Sub-Systems ---
    this.projectiles = []; // Active projectiles owned by this player
    this.statuses = [];    // Active effects (e.g., Burning)
  }

  // ==========================================
  //               CORE UPDATE LOOP
  // ==========================================

  /**
   * Main logic method called every frame.
   * Handles 1. Inertia, 2. Input (if active turn), 3. Projectile updates.
   */
  move(keys, map, players) {
    // 1. Apply Global Inertia (Knockback/Sliding)
    // This happens even if it's NOT the player's turn
    if (Math.abs(this.vx) > 0.1) {
      this.x += this.vx;
      this.vx *= 0.9; // Friction checks
      this.checkCollision(map, "x");
    } else {
      this.vx = 0;
    }

    // 2. Turn Logic (Only if Active)
    if (this.turnActive) {
      if (this.isAiming) {
        // STATIONARY: Player is locked in place, adjusting angle
        handleAiming(this, keys);
        handleMovement(this, {}, map); // Apply gravity only
      } else {
        // MOVING: Player can run/jump
        if (this.canMove) {
          const moved = handleMovement(this, keys, map);
          this.distTraveled += moved;

          // Force Aim Mode if movement runs out
          if (this.distTraveled >= this.maxMovement) {
            this.canMove = false;
            this.toggleAim(); 
          }
        } else {
          handleMovement(this, {}, map); // Apply gravity only
        }
      }
    } else {
      // INACTIVE: Just apply gravity/physics (falling)
      handleMovement(this, {}, map);
    }

    // 3. Update Projectiles
    // Projectiles exist independently of the player's state
    this.updateProjectiles(map, players);
  }

  // ==========================================
  //               RENDERING
  // ==========================================

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Dynamic Color: Dark Blue when aiming to indicate "Locked In"
    ctx.fillStyle = this.turnActive 
      ? (this.isAiming ? "darkblue" : this.color) 
      : "gray";
    
    ctx.fillRect(0, 0, this.width, this.height);

    // UI Elements attached to player
    this._drawHealthBar(ctx);
    this._drawMovementBar(ctx);
    this._drawStatusEffects(ctx);

    // Aim Assist Line
    if (this.isAiming && this.turnActive) {
      this._drawAimLine(ctx);
    }
    
    ctx.restore();

    // Draw active projectiles
    this.projectiles.forEach((p) => p.draw(ctx));
  }

  _drawHealthBar(ctx) {
    const barW = this.width;
    const barH = 6;
    const y = -15;

    // Background (Red)
    ctx.fillStyle = "red";
    ctx.fillRect(0, y, barW, barH);

    // Foreground (Green)
    const pct = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = "green";
    ctx.fillRect(0, y, barW * pct, barH);

    // Border
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, y, barW, barH);
  }

  _drawMovementBar(ctx) {
    if (!this.turnActive) return; // Only show for active player

    const barW = this.width;
    const barH = 4;
    const y = -22;

    // Background
    ctx.fillStyle = "gray";
    ctx.fillRect(0, y, barW, barH);

    // Foreground (Cyan)
    const pct = Math.max(0, (this.maxMovement - this.distTraveled) / this.maxMovement);
    ctx.fillStyle = "cyan";
    ctx.fillRect(0, y, barW * pct, barH);
  }
  
  _drawStatusEffects(ctx) {
    if (!this.statuses) return;

    if (this.statuses.some(s => s.type === "BURNING")) {
        // Draw little fire icon above head
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(this.width / 2, -32, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.arc(this.width / 2, -32, 2, 0, Math.PI * 2);
        ctx.fill();
    }
  }

  _drawAimLine(ctx) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const len = 100;

    const endX = cx + Math.cos(this.aimAngle) * len;
    const endY = cy + Math.sin(this.aimAngle) * len;

    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // ==========================================
  //            COMBAT & PHYSICS
  // ==========================================

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
  
  applyKnockback(forceX, forceY) {
    this.vx += forceX;
    this.dy += forceY;
    this.grounded = false; // Lift off ground immediately
  }

  /**
   * Adds or refreshes a status effect.
   * @param {string} type - "BURNING", etc.
   * @param {number} duration - Number of turns.
   */
  applyStatus(type, duration) {
    if (!this.statuses) this.statuses = [];

    const existing = this.statuses.find(s => s.type === type);
    if (existing) {
        existing.duration = duration; // Refresh
    } else {
        this.statuses.push({ type, duration });
    }
  }

  _processStatusEffects() {
    if (!this.statuses) this.statuses = [];

    this.statuses.forEach(status => {
        if (status.type === "BURNING") {
            // Burn Logic: 10% Max HP damage
            const dmg = Math.floor(this.maxHealth * 0.1);
            this.takeDamage(dmg);
            status.duration--;
        }
    });
    // Remove expired
    this.statuses = this.statuses.filter(s => s.duration > 0);
  }

  // ==========================================
  //            TURN MANAGEMENT
  // ==========================================

  startTurn() {
    this.turnActive = true;
    this.hasFired = false;
    this.isAiming = false;
    this.distTraveled = 0;
    this.canMove = true;
    
    this._processStatusEffects();
  }

  endTurn() {
    this.turnActive = false;
    this.isAiming = false;
  }

  toggleAim() {
    if (!this.turnActive || this.hasFired) return;

    this.isAiming = !this.isAiming;
    // Reset angle based on facing direction when entering aim mode
    if (this.isAiming) {
      this.aimAngle = this.facing === 1 ? 0 : Math.PI;
    }
  }

  /**
   * Factory method meant to be overridden by subclasses.
   */
  createProjectile(x, y, angle) {
    return new Projectile(x, y, angle, this, this.damage);
  }

  shoot() {
    if (!this.turnActive || this.hasFired) return false;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // Use aim angle if aiming, otherwise shoot straight
    const angle = this.isAiming
      ? this.aimAngle
      : (this.facing === 1 ? 0 : Math.PI);

    // Spawn projectile slightly outside player body
    const offset = this.width / 1.5;
    const startX = cx + Math.cos(angle) * offset;
    const startY = cy + Math.sin(angle) * offset;

    this.projectiles.push(this.createProjectile(startX, startY, angle));
    
    this.hasFired = true;
    this.isAiming = false; // Exit aim mode
    
    return true;
  }

  updateProjectiles(map, players) {
    this.projectiles.forEach((p) => p.update(map, players));
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  checkCollision(map, axis) {
    // ... Existing collision logic is fine, just needs to be kept ...
    // Standard AABB logic against grid tiles
    const startCol = Math.floor(this.x / map.tileSize);
    const endCol = Math.floor((this.x + this.width - 0.1) / map.tileSize);
    const startRow = Math.floor(this.y / map.tileSize);
    const endRow = Math.floor((this.y + this.height - 0.1) / map.tileSize);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = map.getTile(col, row);
        
        // Instant Death Logic
        if (tile === tilesTypes.water) {
            this.health = 0;
            return;
        }

        // Solid Block Logic
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
