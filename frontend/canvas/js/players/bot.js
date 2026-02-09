import { Player } from "./player.js";
import { Arrow } from "../projectiles/arrow.js";

export class Bot extends Player {
  constructor(x, y, width, height) {
    super(x, y, width, height, "red", 60, 200); // Less health
    this.damage = 15;
    this.timer = 0;
  }

  createProjectile(x, y, angle) {
    return new Arrow(x, y, angle, this);
  }

  // Logic to simulate inputs
  updateBotLogic(map, players) {
    if (!this.turnActive) return false;

    this.timer++;

    const target = players
      ? players.find((p) => p !== this && p.health > 0)
      : null;

    if (this.timer === 20 && target) {
      if (target.x < this.x) {
        this.facing = -1;
      } else {
        this.facing = 1;
      }
    }

    if (this.timer === 40) {
      if (!this.isAiming) {
        this.toggleAim();
      }
    }

    if (this.timer > 40 && this.timer < 100 && this.isAiming && target) {
      const myCenterX = this.x + this.width / 2;
      const myCenterY = this.y + this.height / 2;
      const targetCenterX = target.x + target.width / 2;
      const targetCenterY = target.y + target.height / 2;

      const dx = targetCenterX - myCenterX;
      // Account for gravity in aim (simple heuristic: aim slightly higher)
      const dy = (targetCenterY - myCenterY) - 50; 

      this.aimAngle = Math.atan2(dy, dx);
    }

    if (this.timer === 100) {
      const fired = this.shoot();
      if (fired) {
        this.timer = 0;
        return true;
      }
    }

    this.checkCollision(map, "y");

    return false;
  }
}
