import { Player } from "./player.js";

export class Bot extends Player {
  constructor(x, y, w, h, color) {
    super(x, y, w, h, color, 50); // Less health for Bot
    this.damage = 15; // Less damage for Bot
    this.timer = 0;
  }

  // Logic to simulate inputs
  updateBotLogic(map, players) {
    // Only act if it's my turn
    if (!this.turnActive) return false;

    this.timer++;

    // Find a target (the first player that isn't me and is alive)
    const target = players
      ? players.find((p) => p !== this && p.health > 0)
      : null;

    // Face the target
    if (this.timer === 20 && target) {
      if (target.x < this.x) {
        this.facing = -1;
      } else {
        this.facing = 1;
      }
    }

    // Enter Aim Mode
    if (this.timer === 40) {
      if (!this.isAiming) {
        this.toggleAim();
      }
    }

    // Aim at target
    if (this.timer > 40 && this.timer < 100 && this.isAiming && target) {
      const myCenterX = this.x + this.w / 2;
      const myCenterY = this.y + this.h / 2;
      const targetCenterX = target.x + target.w / 2;
      const targetCenterY = target.y + target.h / 2;

      const dx = targetCenterX - myCenterX;
      const dy = targetCenterY - myCenterY;

      // Calculate perfect angle
      this.aimAngle = Math.atan2(dy, dx);
    }

    // Shoot
    if (this.timer === 100) {
      const fired = this.shoot();
      if (fired) {
        this.timer = 0; // Reset for next turn
        return true; // Signal turn over
      }
    }

    // Standard physics updates (gravity etc) even while "thinking"
    this.checkCollision(map, "y");

    return false;
  }
}

