/**
 * @module turn_manager
 * @description State arbiter responsible for executing round-robin schedules, 
 * evaluating entity death flags, and determining overarching win/loss conditions.
 */

import { Bot } from "../players/bot.js";

/**
 * @enum {number}
 * @description Enumerated codes signaling the broader engine on how to proceed at the end of a tick.
 */
export const WIN_STATE = {
  PLAYING: 0,     // Game continues
  PLAYER_DIED: 1, // Human lost
  VICTORY: 2,     // All bots defeated
};

/**
 * Orchestrates linear turn sequences across the global entity array.
 */
export class TurnManager {
  constructor() {
    /** @property {number} turnIndex - Tracks the array location of the currently acting entity. */
    this.turnIndex = 0; 
  }

  /**
   * Reinitializes the scheduler. Standardized to index 0 (The Human Player) upon level load.
   */
  reset() {
    this.turnIndex = 0;
  }

  /**
   * Exposes the currently active entity based on internal state.
   * @param {Array<Player>} players - The full entity registry.
   * @returns {Player|null}
   */
  getCurrentPlayer(players) {
    if (!players || players.length === 0) return null;
    return players[this.turnIndex];
  }

  /**
   * Finalizes the current actor's state modifications and advances the pointer 
   * to the next viable (living) entity using modulo iteration.
   * @param {Array<Player>} players - List of all entities.
   * @returns {Player|null} The new active player to assume control.
   */
  nextTurn(players) {
    if (!players || players.length === 0) return null;

    // 1. Cleanup previous player phase (reset movement budgets, cooldowns)
    const current = players[this.turnIndex];
    if (current) current.endTurn();

    // 2. Cycle index until we find a player with health > 0.
    // Employs a fail-safe counter loop to prevent halting the main thread 
    // in Edge Cases where the entire registry evaluates as dead simultaneously.
    let attempts = 0;
    do {
      this.turnIndex = (this.turnIndex + 1) % players.length;
      attempts++;
    } while (players[this.turnIndex].health <= 0 && attempts < players.length);

    // 3. Initialize new player phase (process DoTs, refresh states)
    const nextPlayer = players[this.turnIndex];
    if (nextPlayer && nextPlayer.health > 0) {
        nextPlayer.startTurn();
    }
    
    return nextPlayer;
  }

  /**
   * Evaluates the viability of the current registry state against strict victory and defeat conditions.
   * @param {Array<Player>} players - The registry array.
   * @returns {number} An integer corresponding to the WIN_STATE enum mapping.
   */
  checkGameState(players) {
    // 1. Check Human vitality (Strict architectural assumption: Human is always spawned at index 0)
    const player = players[0];
    if (!player || player.health <= 0) {
      return WIN_STATE.PLAYER_DIED;
    }

    // 2. Check if any Bots remain alive across the entire registry slice
    const hasLivingBots = players.some(p => p instanceof Bot && p.health > 0);
    if (!hasLivingBots) {
      return WIN_STATE.VICTORY;
    }

    // If both human and at least one adversary remain, loop continues
    return WIN_STATE.PLAYING;
  }
}
