/**
 * @module level_manager
 * @description Utilizes the Factory Pattern to construct maps and populate the entity registry 
 * based on deterministic JSON-like configuration files.
 */

import { Map } from "../map.js";
import { Archer } from "../players/archer.js";
import { Mage } from "../players/mage.js";
import { Bot } from "../players/bot.js";
import { Goblin } from "../players/goblin.js";
import { Dragon } from "../players/dragon.js";
import { getLevelConfig } from "./levels.js";

/**
 * Handles the instantiation of topological data and discrete actors for a given stage.
 */
export class LevelManager {
  /**
   * @param {AssetLoader} loader - Global caching utility for image resolution.
   * @param {number} tileSize - The base scalar metric for grid initialization.
   */
  constructor(loader, tileSize) {
    this.loader = loader;
    this.tileSize = tileSize;

    /**
     * @property {Object} entityTypes
     * @description Unified Entity Factory Registry. Maps raw string identifiers from levels.js 
     * and UI selections to their respective concrete Class constructors.
     */
    this.entityTypes = {
      archer: Archer,
      mage: Mage,
      bot: Goblin,
      goblin: Goblin,
      dragon: Dragon
    };
  }

  /**
   * Asynchronously fetches and compiles the CSV topological data.
   * * @param {number} levelNum - The integer level ID.
   * @returns {Promise<Map|null>} An instantiated Map object, or null if the config is missing.
   */
  async loadLevelMap(levelNum) {
    const config = getLevelConfig(levelNum);
    if (!config) {
      console.error(`Level ${levelNum} not found!`);
      return null;
    }

    // Initialize Map with loaded assets
    this.map = new Map(this.tileSize, await this.loader.loadAll());
    await this.map.loadLevel(config.mapFile);
    return this.map;
  }

  /**
   * Iterates through the level configuration to instantiate the player and all hostile actors,
   * returning the master array consumed by the TurnManager.
   * * @param {number} levelNum - The integer level ID.
   * @param {string} playerClass - The user's selected string identifier (e.g., "mage").
   * @returns {Array<Player>} The fully populated global entity registry.
   */
  createEntities(levelNum, playerClass) {
    const config = getLevelConfig(levelNum);
    if (!config) return [];

    const entities = [];

    // 1. Spawn Human Player (Always index 0)
    const p1 = this._createPlayer(playerClass);
    if (p1) entities.push(p1);

    // 2. Spawn Enemies from Config
    config.enemies.forEach(enemyData => {
      const EnemyClass = this.entityTypes[enemyData.type];

      if (EnemyClass) {
        // Standard entity constructor: x, y, width, height
        const enemy = new EnemyClass(
            enemyData.x,
            enemyData.y,
            this.tileSize,
            this.tileSize * 2
        );
        entities.push(enemy);
      } else {
        console.warn(`Unknown enemy type: ${enemyData.type}`);
      }
    });

    return entities;
  }

  /**
   * Factory method isolating the instantiation logic of the primary user-controlled character.
   * Includes a graceful fallback if an invalid class string is provided.
   * * @private
   * @param {string} className - Target class alias.
   * @returns {Player} The constructed playable character.
   */
  _createPlayer(className) {
    // Default start position for the human player
    const startX = 40;
    const startY = 100;
    const height = this.tileSize * 2;

    // Dynamically look up the player class instead of hardcoding an if/else
    const PlayerClass = this.entityTypes[className];
    
    if (PlayerClass) {
      return new PlayerClass(startX, startY, this.tileSize, height);
    }
    
    // Graceful fallback
    console.warn(`Unknown player class: ${className}. Defaulting to Mage.`);
    return new Mage(startX, startY, this.tileSize, height);
  }
}
