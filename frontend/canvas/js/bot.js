import { Player } from "./player.js";

export class Bot extends Player {
  constructor(x, y, w, h, color) {
    super(x, y, w, h, color);
    this.timer = 0;
  }

  // Logic to simulate inputs
  updateBotLogic(map) {
    // Only act if it's my turn
    if (!this.turnActive) return false;

    this.timer++;

    // 1. Wait a bit, then press "T" (Enter Aim Mode)
    if (this.timer === 60) {
      if (!this.isAiming) {
        this.toggleAim();
      }
    }

    // 2. Wait a bit more, then press "X" (Shoot)
    if (this.timer === 120) {
      const fired = this.shoot();
      if (fired) {
        this.timer = 0; // Reset for next turn
        return true; // Signal turn over
      }
    }
    
    // Standard physics updates (gravity etc) even while "thinking"
    // Since we aren't using keys, we pass empty object or handle manually
    // For gravity, we call part of the physics logic manually or rely on move
    this.checkCollision(map, "y"); 

    return false;
  }
}
