import { Player } from "./player.js";
import { Arrow } from "../projectiles/arrow.js";

/**
 * AI-controlled Entity.
 * Overrides movement/input logic with a timer-based state machine.
 */
export class Bot extends Player {
  constructor(x, y, width, height) {
    super(x, y, width, height, "red", 60, 200); // Lower stats than human
    this.damage = 15;
    this.timer = 0;
  }

  createProjectile(x, y, angle) {
    return new Arrow(x, y, angle, this);
  }

  /**
   * AI "Brain". Called every frame during Bot's turn.
   * returns true if turn is finished.
   */
  updateBotLogic(map, players) {
    if (!this.turnActive) return false;

    this.timer++;

    // 1. Acquire Target (Nearest living enemy logic could go here, currently just "any")
    const target = players
      ? players.find((p) => p !== this && p.health > 0)
      : null;

    if (!target) return true; // Skip turn if no targets

    // 2. Face the target (Frame 20)
    if (this.timer === 20) {
      this.facing = target.x < this.x ? -1 : 1;
    }

    // 3. Start Aiming (Frame 40)
    if (this.timer === 40) {
      if (!this.isAiming) this.toggleAim();
    }

    // 4. Adjust Aim Angle (Frames 41-99)
    if (this.timer > 40 && this.timer < 100 && this.isAiming) {
      const myCX = this.x + this.width / 2;
      const myCY = this.y + this.height / 2;
      const tCX = target.x + target.width / 2;
      const tCY = target.y + target.height / 2;

      const dx = tCX - myCX;
      // Heuristic: Aim 50px higher than target to account for gravity arc
      const dy = (tCY - myCY) - 50; 

      this.aimAngle = Math.atan2(dy, dx);
    }

    // 5. Fire (Frame 100)
    if (this.timer === 100) {
      const fired = this.shoot();
      if (fired) {
        this.timer = 0;
        return true; // End turn
      }
    }

    // Apply gravity/physics during this process
    this.checkCollision(map, "y");

    return false;
  }
}
