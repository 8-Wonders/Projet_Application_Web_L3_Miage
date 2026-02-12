import { Map } from "../map.js";
import { Archer } from "../players/archer.js";
import { Mage } from "../players/mage.js";
import { Bot } from "../players/bot.js";
import { Goblin } from "../players/goblin.js";

export class LevelManager {
  constructor(loader, tileSize) {
    this.loader = loader;
    this.tileSize = tileSize;
    this.map = null;
  }

  async loadLevel(levelNum) {
    const mapFile = `assets/maps/0${levelNum}.csv`;
    this.map = new Map(this.tileSize, await this.loader.loadAll());
    await this.map.loadLevel(mapFile);
    return this.map;
  }

  createEntities(levelNum, playerClass) {
    // 1. Create Human
    let p1;
    if (playerClass === "archer") {
      p1 = new Archer(40, 100, this.tileSize, this.tileSize * 2);
    } else {
      p1 = new Mage(40, 100, this.tileSize, this.tileSize * 2);
    }

    // 2. Create Bots
    const bots = [];
    
    // Default bot for all levels
    bots.push(new Bot(600, 100, this.tileSize, this.tileSize * 2));

    // Specific logic for Level 2
    if (levelNum === 2) {
      // Replaced the second standard Bot with a Goblin
      bots.push(new Goblin(750, 100, this.tileSize, this.tileSize * 2));
    }

    return [p1, ...bots];
  }
}
