/**
 * @module player
 * @description Defines the core physical, interactive, and combat mechanics for all dynamic entities.
 * Serves as the foundational base class for both human-controlled character classes and AI bots.
 */

import { Projectile } from "../projectiles/projectile.js";
import { handleMovement, handleAiming, mouse } from "../input.js";
import { tilesTypes } from "../map.js";
import { GraphicalObject } from "../graphical_object.js";
import { Teleport } from "../projectiles/teleport.js";

/**
 * The master entity class encompassing spatial physics, rendering pipelines, state management, 
 * and combat interactions. Designed to be extended by specific classes (e.g., Mage, Bot).
 * * @extends GraphicalObject
 */
export class Player extends GraphicalObject {
  /**
   * Initializes a physical entity within the game world.
   * * @param {number} x - Absolute X coordinate in world space.
   * @param {number} y - Absolute Y coordinate in world space.
   * @param {number} width - Entity collision bounding box width.
   * @param {number} height - Entity collision bounding box height.
   * @param {string} color - The logical string identifier for sprite resolution and fallback color.
   * @param {number} [health=100] - Base structural integrity / hit points.
   * @param {number} [maxMovement=300] - Maximum pixel displacement allowed per turn.
   */
  constructor(x, y, width, height, color, health = 100, maxMovement = 300) {
    super(x, y, width, height, color);

    // --- Vitality & Stats ---
    this.health = health;
    this.maxHealth = health;
    this.damage = 30; 

    // --- Physics & Kinematics ---
    this.speed = 5;
    this.vx = 0; 
    this.dy = 0; 
    this.jumpStrength = 17;
    this.gravity = 0.8;
    this.grounded = false; 

    // --- Turn & Action State ---
    this.maxMovement = maxMovement; 
    this.distTraveled = 0;
    this.canMove = true;
    this.turnActive = false; 
    this.hasFired = false;   

    // --- Targeting & Aiming ---
    this.facing = 1; 
    this.isAiming = false;
    this.aimAngle = 0;
    this.aimRotationSpeed = 0.05;

    // --- Memory & Inventory ---
    this.projectiles = []; 
    this.statuses = [];    
    
    this.abilities = [Projectile]; 
    this.abilityIndex = 0;
  }

  // ==========================================
  //               CORE UPDATE LOOP
  // ==========================================

  /**
   * Primary physics integrator and state mutator. Evaluates inertia, horizontal friction, 
   * user input mapping, and delegates boundary checks to the collision engine.
   * * @param {Object} keys - A map of currently active keyboard inputs.
   * @param {Map} map - The spatial grid for environmental collision verification.
   * @param {Array<Player>} players - The registry of all entities, required for projectile collision tracking.
   */
  move(keys, map, players) {
    // 1. Process Horizontal Inertia & Friction
    if (Math.abs(this.vx) > 0.1) {
      this.x += this.vx;
      this.vx *= 0.9; 
      this.checkCollision(map, "x");
    } else {
      this.vx = 0;
    }

    // 2. Process Turn-Based Input
    if (this.turnActive) {
      if (this.isAiming) {
        // Prevent rotational aiming if the selected ability relies on absolute mouse coordinates (e.g., Teleport)
        if (this.abilities[this.abilityIndex] !== Teleport) {
            handleAiming(this, keys);
        }
        handleMovement(this, {}, map); 
      } else {
        if (this.canMove) {
          const moved = handleMovement(this, keys, map);
          this.distTraveled += moved;

          // Exhaust movement budget, force transition to combat phase
          if (this.distTraveled >= this.maxMovement) {
            this.canMove = false;
            this.toggleAim(); 
          }
        } else {
          handleMovement(this, {}, map); 
        }
      }
    } else {
      // Passive physics update for non-active entities (gravity, falling)
      handleMovement(this, {}, map);
    }

    this.updateProjectiles(map, players);
  }

  // ==========================================
  //               RENDERING
  // ==========================================

  /**
   * Orchestrates the visual rendering pipeline for this entity, stacking sprites, 
   * HUD elements, and contextual aiming UI elements sequentially.
   * * @param {CanvasRenderingContext2D} ctx - The active canvas context.
   * @param {Object} loader - The asset manager responsible for fetching cached textures.
   */
  draw(ctx, loader) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // 1. Draw Active Turn Indication (Selection/Aiming Outline)
    if (this.turnActive) {
      ctx.strokeStyle = this.isAiming ? "rgba(0, 0, 139, 0.9)" : "rgba(255, 255, 0, 0.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(-2, -2, this.width + 4, this.height + 4);
    }

    // 2. Sprite Resolution & Rendering
    const facingSuffix = this.facing === -1 ? "0" : "1";
    const spriteKey = `${this.color}_${facingSuffix}`; 
    const img = loader ? loader.get(spriteKey) : null;

    if (img) {
	  // Calculate scale factor using the logical height as the definitive anchor
      const scale = this.height / img.height;

      // Maintain aspect ratio footprint
      const drawWidth = img.width * scale;
      const drawHeight = this.height; // Exactly the hitbox height

      // Center the sprite relative to the collision AABB
      const offsetX = (this.width - drawWidth) / 2;
      const offsetY = 0; // Bottom-aligned

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      // Fallback Rendering Strategy (Primitives)
      ctx.fillStyle = this.color;
      if (this.color === "archer") ctx.fillStyle = "green";
      if (this.color === "mage") ctx.fillStyle = "red";
      if (this.color === "goblin") ctx.fillStyle = "#27AE60";
      
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 3. Delegate to HUD renderers
    this._drawHealthBar(ctx);
    this._drawMovementBar(ctx);
    this._drawStatusEffects(ctx);

    // 4. Delegate to contextual targeting renderers
    if (this.isAiming && this.turnActive) {
      const currentAbility = this.abilities[this.abilityIndex];
      if (currentAbility.name === "Teleport") { 
        this._drawTeleportTarget(ctx);
      } else {
        this._drawAimLine(ctx);
      }
    }
    
    ctx.restore();

    // 5. Render detached, orphaned objects (projectiles owned by this entity)
    this.projectiles.forEach((p) => p.draw(ctx, loader));
  }

  /**
   * Renders a dashed reticle and a tether line indicating the destination of spatial abilities.
   * @private
   */
  _drawTeleportTarget(ctx) {
    const relX = mouse.x - this.x;
    const relY = mouse.y - this.y;

    ctx.save();
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); 
    
    ctx.strokeRect(relX - this.width/2, relY - this.height/2, this.width, this.height);
    
    ctx.beginPath();
    ctx.moveTo(this.width/2, this.height/2);
    ctx.lineTo(relX, relY);
    ctx.stroke();
    
    ctx.restore();
  }

  /**
   * Renders the health vitality indicator anchored above the entity.
   * @private
   */
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

  /**
   * Renders the action-point/movement allowance gauge.
   * @private
   */
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
  
  /**
   * Visually communicates active buffs/debuffs affecting the entity.
   * @private
   */
  _drawStatusEffects(ctx) {
    if (!this.statuses) return;
    if (this.statuses.some(s => s.type === "BURNING")) {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(this.width / 2, -32, 5, 0, Math.PI * 2);
        ctx.fill();
    }
  }

  /**
   * Renders the ballistic trajectory predictor for standard projectiles.
   * @private
   */
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

  /**
   * Subtracts integrity from the entity, bottoming out at 0.
   * @param {number} amount - Raw integer damage to be applied.
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
  
  /**
   * Applies impulse forces directly to the entity's velocity vectors.
   * Automatically strips grounded status to ensure gravity re-evaluates.
   * @param {number} forceX - Horizontal Newton impulse.
   * @param {number} forceY - Vertical Newton impulse (typically negative to throw upward).
   */
  applyKnockback(forceX, forceY) {
    this.vx += forceX;
    this.dy += forceY;
    this.grounded = false; 
  }

  /**
   * Injects a persistent debuff/buff into the entity's status queue.
   * Refreshes the duration rather than stacking if the effect already exists.
   * @param {string} type - The string identifier for the status (e.g., "BURNING").
   * @param {number} duration - The number of turns the effect should persist.
   */
  applyStatus(type, duration) {
    if (!this.statuses) this.statuses = [];
    const existing = this.statuses.find(s => s.type === type);
    if (existing) {
        existing.duration = duration; 
    } else {
        this.statuses.push({ type, duration });
    }
  }

  /**
   * Iterates through active debuffs, mutating health/state as required, 
   * and purges expired statuses. Invoked at the start of the entity's turn.
   * @private
   */
  _processStatusEffects() {
    if (!this.statuses) this.statuses = [];
    this.statuses.forEach(status => {
        if (status.type === "BURNING") {
            const dmg = Math.floor(this.maxHealth * 0.1); // 10% max HP DoT
            this.takeDamage(dmg);
            status.duration--;
        }
    });
    // Filter out expired statuses
    this.statuses = this.statuses.filter(s => s.duration > 0);
  }

  // ==========================================
  //            TURN MANAGEMENT
  // ==========================================

  /**
   * Initializes state variables required for a new action phase.
   * Triggers synchronous, turn-based events like DoT processing.
   */
  startTurn() {
    this.turnActive = true;
    this.hasFired = false;
    this.isAiming = false;
    this.distTraveled = 0;
    this.canMove = true;
    
    this._processStatusEffects();
  }

  /**
   * Finalizes the entity's action phase, resetting localized combat flags.
   */
  endTurn() {
    this.turnActive = false;
    this.isAiming = false;
  }

  /**
   * Transitions the entity between the Movement phase and the Combat (Aiming) phase.
   * Enforces sequence-breaking checks to prevent aiming if the entity has already attacked.
   */
  toggleAim() {
    if (!this.turnActive || this.hasFired) return;

    this.isAiming = !this.isAiming;
    if (this.isAiming) {
      // Default initial aim direction based on current spatial facing
      this.aimAngle = this.facing === 1 ? 0 : Math.PI;
    }
  }

  /**
   * Safely transitions the active hotbar index for weapon selection.
   * @param {number} index - The zero-based integer index mapping to the `abilities` array.
   */
  switchAbility(index) {
    if (index >= 0 && index < this.abilities.length) {
      this.abilityIndex = index;
    }
  }

  /**
   * Instantiates the currently selected ability class into physical space, applying 
   * derived trajectories and locking the entity out of subsequent actions.
   * * @returns {boolean} True if the shot was successfully executed, false if blocked by state flags.
   */
  shoot() {
    if (!this.turnActive || this.hasFired) return false;

    // Resolve emission origin (center mass)
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    const angle = this.isAiming
      ? this.aimAngle
      : (this.facing === 1 ? 0 : Math.PI);

    // Push the spawn point slightly outside the hitbox to prevent immediate self-collision
    const offset = this.width / 1.5;
    const startX = cx + Math.cos(angle) * offset;
    const startY = cy + Math.sin(angle) * offset;

    const AbilityClass = this.abilities[this.abilityIndex];
    if (AbilityClass) {
        if (AbilityClass === Teleport) {
             // Coordinate-based instant abilities require global mouse data
             this.projectiles.push(new AbilityClass(startX, startY, angle, this, mouse.x, mouse.y));
        } else {
             // Standard ballistic projection
             this.projectiles.push(new AbilityClass(startX, startY, angle, this));
        }
    }

    // Flag weapon cooldown / turn finality
    this.hasFired = true;
    this.isAiming = false; 
    
    return true;
  }

  /**
   * Iterates through all active projectiles owned by this entity, forcing their 
   * spatial update steps and culling resolving/destroyed instances from memory.
   * * @param {Map} map - The spatial grid instance.
   * @param {Array<Player>} players - The registry of all entities.
   */
  updateProjectiles(map, players) {
    this.projectiles.forEach((p) => p.update(map, players));
    // Garbage collection of inert/resolved physics objects
    this.projectiles = this.projectiles.filter((p) => p.active);
  }

  /**
   * Executes AABB (Axis-Aligned Bounding Box) resolution against the static tilemap geometry.
   * Iterates along the specified axis delta to prevent tunneling, snapping the entity 
   * precisely to the grid boundary upon collision.
   * * @param {Map} map - The grid map containing spatial logic integers.
   * @param {string} axis - The vector component currently being resolved ("x" or "y").
   */
  checkCollision(map, axis) {
    const startCol = Math.floor(this.x / map.tileSize);
    const endCol = Math.floor((this.x + this.width - 0.1) / map.tileSize);
    const startRow = Math.floor(this.y / map.tileSize);
    const endRow = Math.floor((this.y + this.height - 0.1) / map.tileSize);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const tile = map.getTile(col, row);
        
        // Fatal Hazard Check
        if (tile === tilesTypes.water) {
            this.health = 0;
            return;
        }

        // Solid Geometry Check
        if (tile !== 0) {
          if (axis === "x") {
            // Horizontal snapping
            if (this.x < col * map.tileSize) {
              this.x = col * map.tileSize - this.width;
            } else {
              this.x = (col + 1) * map.tileSize;
            }
          } else {
            // Vertical snapping
            if (this.dy > 0) {
              // Falling onto an obstacle
              this.y = row * map.tileSize - this.height;
              this.dy = 0;
              this.grounded = true;
            } else if (this.dy < 0) {
              // Jumping into an obstacle (ceiling collision)
              this.y = (row + 1) * map.tileSize;
              this.dy = 0;
            }
          }
        }
      }
    }
  }
}
