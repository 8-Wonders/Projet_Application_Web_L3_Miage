import { Map } from "../map.js";
import { Archer } from "../players/archer.js";
import { Mage } from "../players/mage.js";
import { Bot } from "../players/bot.js";
import { Goblin } from "../players/goblin.js";
import { Dragon } from "../players/dragon.js";

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

    if (levelNum === 3) {
      // === LEVEL 3: DRAGON BOSS ===
      // Spawns a single Dragon
      bots.push(new Dragon(600, 100, this.tileSize, this.tileSize * 2));
    } else {
      // === LEVELS 1 & 2 ===
      // Always add 1 Standard Bot
      bots.push(new Bot(600, 100, this.tileSize, this.tileSize * 2));

      // Level 2 adds a Goblin
      if (levelNum === 2) {
        bots.push(new Goblin(750, 100, this.tileSize, this.tileSize * 2));
      }
    }

    return [p1, ...bots];
  }
}
