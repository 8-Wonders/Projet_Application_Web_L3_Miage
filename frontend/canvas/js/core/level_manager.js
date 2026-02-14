import { Map } from "../map.js";
import { Archer } from "../players/archer.js";
import { Mage } from "../players/mage.js";
import { Bot } from "../players/bot.js";
import { Goblin } from "../players/goblin.js";
import { Dragon } from "../players/dragon.js";
import { getLevelConfig } from "./levels.js";

export class LevelManager {
  constructor(loader, tileSize) {
    this.loader = loader;
    this.tileSize = tileSize;
    
    // Entity Factory Mapping
    this.enemyTypes = {
      bot: Bot,
      goblin: Goblin,
      dragon: Dragon
    };
  }

  async loadLevelMap(levelNum) {
    const config = getLevelConfig(levelNum);
    if (!config) {
      console.error(`Level ${levelNum} not found!`);
      return null;
    }

    // Load the specific map file defined in config
    this.map = new Map(this.tileSize, await this.loader.loadAll());
    await this.map.loadLevel(config.mapFile);
    return this.map;
  }

  createEntities(levelNum, playerClass) {
    const config = getLevelConfig(levelNum);
    if (!config) return [];

    const entities = [];

    // 1. Create Player
    const p1 = this._createPlayer(playerClass);
    entities.push(p1);

    // 2. Create Enemies from Config
    config.enemies.forEach(enemyData => {
      const EnemyClass = this.enemyTypes[enemyData.type];
      if (EnemyClass) {
        // Standard entity constructor signature: x, y, tileSize, height
        entities.push(new EnemyClass(enemyData.x, enemyData.y, this.tileSize, this.tileSize * 2));
      } else {
        console.warn(`Unknown enemy type: ${enemyData.type}`);
      }
    });

    return entities;
  }

  _createPlayer(className) {
    // Default player spawn coords
    const x = 40;
    const y = 100;
    
    if (className === "archer") {
      return new Archer(x, y, this.tileSize, this.tileSize * 2);
    } 
    return new Mage(x, y, this.tileSize, this.tileSize * 2);
  }
}
