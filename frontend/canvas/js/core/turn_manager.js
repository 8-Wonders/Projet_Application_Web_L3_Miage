import { Bot } from "../players/bot.js";

export const WIN_STATE = {
  NONE: 0,
  PLAYER_DIED: 1,
  ALL_BOTS_DEAD: 2,
};

export class TurnManager {
  constructor(game) {
    this.game = game; // Reference to main game for accessing players
    this.turnIndex = 0;
  }

  reset() {
    this.turnIndex = 0;
    if (this.game.players.length > 0) {
        this.game.players[0].startTurn();
    }
  }

  getCurrentPlayer() {
    if (!this.game.players || this.game.players.length === 0) return null;
    return this.game.players[this.turnIndex];
  }

  nextTurn() {
    const players = this.game.players;
    players[this.turnIndex].endTurn();

    // Loop until we find a living player
    let loops = 0;
    do {
      this.turnIndex = (this.turnIndex + 1) % players.length;
      loops++;
    } while (players[this.turnIndex].health <= 0 && loops < players.length);

    players[this.turnIndex].startTurn();
  }

  checkWinStatus() {
    const players = this.game.players;
    const p1 = players[0]; // Assuming P1 is always index 0

    // 1. Human Died
    if (p1.health <= 0) {
      return WIN_STATE.PLAYER_DIED;
    }

    // 2. Check Bots
    const activeBots = players.filter((p) => p instanceof Bot && p.health > 0);
    if (activeBots.length === 0) {
      return WIN_STATE.ALL_BOTS_DEAD;
    }

    return WIN_STATE.NONE;
  }
}
