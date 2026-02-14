import { Bot } from "../players/bot.js";

/**
 * Enum for the result of a Game State check.
 */
export const WIN_STATE = {
  PLAYING: 0,     // Game continues
  PLAYER_DIED: 1, // Human lost
  VICTORY: 2,     // All bots defeated
};

export class TurnManager {
  constructor() {
    this.turnIndex = 0; // Index of the player currently acting
  }

  reset() {
    this.turnIndex = 0;
  }

  getCurrentPlayer(players) {
    if (!players || players.length === 0) return null;
    return players[this.turnIndex];
  }

  /**
   * Ends current player's turn and cycles to the next LIVING player.
   * @param {Array} players - List of all entities
   * @returns {Object|null} The new active player
   */
  nextTurn(players) {
    if (!players || players.length === 0) return null;

    // 1. Cleanup previous player
    const current = players[this.turnIndex];
    if (current) current.endTurn();

    // 2. Cycle index until we find a player with health > 0
    // Use a counter to prevent infinite loops if everyone is dead
    let attempts = 0;
    do {
      this.turnIndex = (this.turnIndex + 1) % players.length;
      attempts++;
    } while (players[this.turnIndex].health <= 0 && attempts < players.length);

    // 3. Initialize new player
    const nextPlayer = players[this.turnIndex];
    if (nextPlayer && nextPlayer.health > 0) {
        nextPlayer.startTurn();
    }
    
    return nextPlayer;
  }

  /**
   * checks if the game has ended.
   */
  checkGameState(players) {
    // 1. Check Human (Assumed to be at index 0)
    const player = players[0];
    if (!player || player.health <= 0) {
      return WIN_STATE.PLAYER_DIED;
    }

    // 2. Check if any Bots remain alive
    const hasLivingBots = players.some(p => p instanceof Bot && p.health > 0);
    if (!hasLivingBots) {
      return WIN_STATE.VICTORY;
    }

    return WIN_STATE.PLAYING;
  }
}
