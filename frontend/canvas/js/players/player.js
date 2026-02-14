import { Projectile } from "../projectiles/projectile.js";
import { handleMovement, handleAiming, mouse } from "../input.js";
import { tilesTypes } from "../map.js";
import { GraphicalObject } from "../graphical_object.js";
import { Teleport } from "../projectiles/teleport.js";

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
    this.vx = 0; // Horizontal inertia
    this.dy = 0; // Vertical velocity
    this.jumpStrength = 17;
    this.gravity = 0.8;
    this.grounded = false; 

    // --- Turn Constraints ---
    this.maxMovement = maxMovement; 
    this.distTraveled = 0;
    this.canMove = true;
    this.turnActive = false; 
    this.hasFired = false;   

    // --- Aiming ---
    this.facing = 1; // 1 = Right, -1 = Left
    this.isAiming = false;
    this.aimAngle = 0;
    this.aimRotationSpeed = 0.05;

    // --- Sub-Systems ---
    this.projectiles = []; 
    this.statuses = [];    
    
    // --- Loadout / Abilities ---
    this.abilities = [Projectile]; 
    this.abilityIndex = 0;
  }

  // ==========================================
  //               CORE UPDATE LOOP
  // ==========================================

  move(keys, map, players) {
    // 1. Apply Global Inertia 
    if (Math.abs(this.vx) > 0.1) {
      this.x += this.vx;
      this.vx *= 0.9; 
      this.checkCollision(map, "x");
    } else {
      this.vx = 0;
    }

    // 2. Turn Logic (Only if Active)
    if (this.turnActive) {
      if (this.isAiming) {
        // STATIONARY: Aiming
        // Only rotate angle if NOT teleporting (Teleport uses Mouse)
        if (this.abilities[this.abilityIndex] !== Teleport) {
            handleAiming(this, keys);
        }
        handleMovement(this, {}, map); // Apply gravity only
      } else {
        // MOVING
        if (this.canMove) {
          const moved = handleMovement(this, keys, map);
          this.distTraveled += moved;

          if (this.distTraveled >= this.maxMovement) {
            this.canMove = false;
            this.toggleAim(); 
          }
        } else {
          handleMovement(this, {}, map); 
        }
      }
    } else {
      handleMovement(this, {}, map);
    }

    // 3. Update Projectiles
    this.updateProjectiles(map, players);
  }

  // ==========================================
  //               RENDERING
  // ==========================================

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    ctx.fillStyle = this.turnActive 
      ? (this.isAiming ? "darkblue" : this.color) 
      : "gray";
    
    ctx.fillRect(0, 0, this.width, this.height);

    this._drawHealthBar(ctx);
    this._drawMovementBar(ctx);
    this._drawStatusEffects(ctx);

    // --- Aiming Visuals ---
    if (this.isAiming && this.turnActive) {
      const currentAbility = this.abilities[this.abilityIndex];

      if (currentAbility === Teleport) {
        // Draw Teleport Square at Mouse Position
        this._drawTeleportTarget(ctx);
      } else {
        // Draw Standard Aim Line
        this._drawAimLine(ctx);
      }
    }
    
    ctx.restore();

    this.projectiles.forEach((p) => p.draw(ctx));
  }

  _drawTeleportTarget(ctx) {
    // We need global coordinates, but we are inside ctx.translate(this.x, this.y)
    // So we must subtract this.x/y from mouse coordinates to draw correctly relative to player
    const relX = mouse.x - this.x;
    const relY = mouse.y - this.y;

    ctx.save();
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Dashed line
    
    // Draw box centered on mouse
    ctx.strokeRect(relX - this.width/2, relY - this.height/2, this.width, this.height);
    
    // Draw line connecting player to target
    ctx.beginPath();
    ctx.moveTo(this.width/2, this.height/2);
    ctx.lineTo(relX, relY);
    ctx.stroke();
    
    ctx.restore();
  }

  _drawHealthBar(ctx) {
    const barW = this.width;
    const barH = 6;
    const y = -15;

    ctx.fillStyle = "red";
    ctx.fillRect(0, y, barW, barH);

    const pct = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = "green";
    ctx.fillRect(0, y, barW * pct, barH);

    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, y, barW, barH);
  }

  _drawMovementBar(ctx) {
    if (!this.turnActive) return; 

    const barW = this.width;
    const barH = 4;
    const y = -22;

    ctx.fillStyle = "gray";
    ctx.fillRect(0, y, barW, barH);

    const pct = Math.max(0, (this.maxMovement - this.distTraveled) / this.maxMovement);
    ctx.fillStyle = "cyan";
    ctx.fillRect(0, y, barW * pct, barH);
  }
  
  _drawStatusEffects(ctx) {
    if (!this.statuses) return;
    if (this.statuses.some(s => s.type === "BURNING")) {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(this.width / 2, -32, 5, 0, Math.PI * 2);
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
    this.grounded = false; 
  }

  applyStatus(type, duration) {
    if (!this.statuses) this.statuses = [];
    const existing = this.statuses.find(s => s.type === type);
    if (existing) {
        existing.duration = duration; 
    } else {
        this.statuses.push({ type, duration });
    }
  }

  _processStatusEffects() {
    if (!this.statuses) this.statuses = [];
    this.statuses.forEach(status => {
        if (status.type === "BURNING") {
            const dmg = Math.floor(this.maxHealth * 0.1);
            this.takeDamage(dmg);
            status.duration--;
        }
    });
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

  switchAbility(index) {
    if (index >= 0 && index < this.abilities.length) {
      this.abilityIndex = index;
    }
  }

  /**
   * Spawns the currently selected projectile.
   */
  shoot() {
    if (!this.turnActive || this.hasFired) return false;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    const angle = this.isAiming
      ? this.aimAngle
      : (this.facing === 1 ? 0 : Math.PI);

    const offset = this.width / 1.5;
    const startX = cx + Math.cos(angle) * offset;
    const startY = cy + Math.sin(angle) * offset;

    const AbilityClass = this.abilities[this.abilityIndex];
    if (AbilityClass) {
        // Special Logic: Teleport needs Mouse Coordinates
        if (AbilityClass === Teleport) {
             this.projectiles.push(new AbilityClass(startX, startY, angle, this, mouse.x, mouse.y));
        } else {
             this.projectiles.push(new AbilityClass(startX, startY, angle, this));
        }
    }

    this.hasFired = true;
    this.isAiming = false; 
    
    return true;
  }

  updateProjectiles(map, players) {
    this.projectiles.forEach((p) => p.update(map, players));
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  checkCollision(map, axis) {
    const startCol = Math.floor(this.x / map.tileSize);
    const endCol = Math.floor((this.x + this.width - 0.1) / map.tileSize);
    const startRow = Math.floor(this.y / map.tileSize);
    const endRow = Math.floor((this.y + this.height - 0.1) / map.tileSize);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = map.getTile(col, row);
        
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
