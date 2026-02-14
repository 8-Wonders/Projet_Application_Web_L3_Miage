import { Map } from "../map.js";
import { Archer } from "../players/archer.js";
import { Mage } from "../players/mage.js";
import { Bot } from "../players/bot.js";
import { Goblin } from "../players/goblin.js";
import { Dragon } from "../players/dragon.js";
import { getLevelConfig } from "./levels.js";

/**
 * Handles loading map files and creating entity instances (Players/Enemies).
 */
export class LevelManager {
  constructor(loader, tileSize) {
    this.loader = loader;
    this.tileSize = tileSize;
    
    // Entity Factory Registry
    // Maps string keys from levels.js to actual Class constructors
    this.enemyTypes = {
      bot: Bot,
      goblin: Goblin,
      dragon: Dragon
    };
  }

  /**
   * Loads the map data for a specific level ID.
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
   * Spawns the Main Player and all Enemies defined in the level config.
   */
  createEntities(levelNum, playerClass) {
    const config = getLevelConfig(levelNum);
    if (!config) return [];

    const entities = [];

    // 1. Spawn Human Player
    const p1 = this._createPlayer(playerClass);
    entities.push(p1);

    // 2. Spawn Enemies from Config
    config.enemies.forEach(enemyData => {
      const EnemyClass = this.enemyTypes[enemyData.type];
      
      if (EnemyClass) {
        // Standard entity constructor: x, y, tileSize, height
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
   * Factory method for the Human Player.
   */
  _createPlayer(className) {
    // Default start position for the human player
    const startX = 40;
    const startY = 100;
    const height = this.tileSize * 2;
    
    if (className === "archer") {
      return new Archer(startX, startY, this.tileSize, height);
    } 
    return new Mage(startX, startY, this.tileSize, height);
  }
}
