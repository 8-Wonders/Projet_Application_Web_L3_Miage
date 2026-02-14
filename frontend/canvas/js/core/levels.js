// data/levels.js
export const LEVEL_CONFIG = [
  {
    id: 1,
    mapFile: "assets/maps/01.csv",
    // Enemies config: type, x, y
    enemies: [
      { type: "bot", x: 600, y: 100 }
    ]
  },
  {
    id: 2,
    mapFile: "assets/maps/02.csv",
    enemies: [
      { type: "bot", x: 600, y: 100 },
      { type: "goblin", x: 750, y: 100 }
    ]
  },
  {
    id: 3,
    mapFile: "assets/maps/03.csv",
    enemies: [
      { type: "dragon", x: 600, y: 100 }
    ]
  }
];

// Easy lookup by ID if needed, though array index (id-1) works too
export const getLevelConfig = (id) => LEVEL_CONFIG.find(l => l.id === id);
