/**
 * Configuration for all Game Levels.
 */
export const LEVEL_CONFIG = [
  {
    id: 1,
    mapFile: "assets/maps/01.csv",
    enemies: [
      { type: "bot", x: 600, y: 100 }
    ]
  },
  {
    id: 2,
    mapFile: "assets/maps/02.csv",
    enemies: [
      { type: "goblin", x: 1150, y: 100 },
      { type: "bot", x: 1728, y: 100 }
    ]
  },
  {
    id: 3,
    mapFile: "assets/maps/03.csv",
    enemies: [
      { type: "dragon", x: 500, y: 100 }
    ]
  }
];

export const getLevelConfig = (id) => LEVEL_CONFIG.find(l => l.id === id);
