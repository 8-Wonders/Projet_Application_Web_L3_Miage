import { Bot } from "../players/bot.js";

export const WIN_STATE = {
  PLAYING: 0,
  PLAYER_DIED: 1,
  VICTORY: 2,
};

export class TurnManager {
  constructor() {
    this.turnIndex = 0;
  }

  reset() {
    this.turnIndex = 0;
  }

  getCurrentPlayer(players) {
    if (!players || players.length === 0) return null;
    return players[this.turnIndex];
  }

  /**
   * Advances to the next living player.
   * Returns the new current player.
   */
  nextTurn(players) {
    if (!players || players.length === 0) return null;

    // End current player's turn
    const current = players[this.turnIndex];
    if (current) current.endTurn();

    // Cycle until we find a living player
    let attempts = 0;
    do {
      this.turnIndex = (this.turnIndex + 1) % players.length;
      attempts++;
    } while (players[this.turnIndex].health <= 0 && attempts < players.length);

    // Start next turn
    const nextPlayer = players[this.turnIndex];
    if (nextPlayer && nextPlayer.health > 0) {
        nextPlayer.startTurn();
    }
    
    return nextPlayer;
  }

  checkGameState(players) {
    // 1. Check Human (Assuming Player is always index 0)
    const player = players[0];
    if (!player || player.health <= 0) {
      return WIN_STATE.PLAYER_DIED;
    }

    // 2. Check Bots
    const hasLivingBots = players.some(p => p instanceof Bot && p.health > 0);
    if (!hasLivingBots) {
      return WIN_STATE.VICTORY;
    }

    return WIN_STATE.PLAYING;
  }
}
