/**
 * @module levels
 * @description Static registry defining the topological flow and enemy spawning coordinates for the campaign.
 */

/**
 * @typedef {Object} EnemySpawn
 * @property {string} type - The string identifier mapping to `LevelManager.entityTypes`.
 * @property {number} x - The absolute starting X coordinate on the grid.
 * @property {number} y - The absolute starting Y coordinate on the grid.
 */

/**
 * @typedef {Object} LevelData
 * @property {number} id - Unique numeric identifier for the stage.
 * @property {string} mapFile - The URI path to the corresponding CSV terrain layout.
 * @property {Array<EnemySpawn>} enemies - The collection of hostile actors to instantiate.
 */

/**
 * Configuration array for all Game Levels. Acts as the primary sequence blueprint.
 * @type {Array<LevelData>}
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
      { type: "bot", x: 800, y: 100 },
      { type: "goblin", x: 1150, y: 100 }
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

/**
 * Utility selector to retrieve a specific configuration payload safely.
 * @param {number} id - Target level identifier.
 * @returns {LevelData|undefined} The matching configuration object, or undefined if missing.
 */
export const getLevelConfig = (id) => LEVEL_CONFIG.find(l => l.id === id);
