/**
 * @module map
 * @description Manages the spatial grid, level parsing, and environmental rendering of the game world.
 */

import * as CSV from "../../common/csv-parser.js";

/**
 * @enum {number}
 * @description Static registry mapping logical terrain types to their corresponding integer IDs.
 * Used for matrix population, collision physics, and texture resolution.
 */
export const tilesTypes = {
  grass: 0,
  brick: 1,
  water: 2,
  stone: 3,
};

/**
 * Represents the game level environment. Handles the asynchronous loading of map data,
 * storage of the grid matrix, and tile-based rendering operations.
 */
export class Map {
  /**
   * Initializes the Map subsystem.
   * * @param {number} tileSize - The uniform width and height (in pixels) for each tile in the grid.
   * @param {Array<HTMLImageElement>} textures - Pre-loaded image assets indexed by their `tilesTypes` integer ID.
   */
  constructor(tileSize, textures) {
    this.tileSize = tileSize;
    this.textures = textures; // Array of Image objects

    this.level = []; // 2D Array representing the grid
    this.isLoaded = false;
  }

  /**
   * Asynchronously fetches and parses a level blueprint from a remote CSV file.
   * Transforms the raw comma-separated text into a navigable 2D matrix structure.
   * * @async
   * @param {string} filePath - The relative or absolute URI to the target .csv asset.
   * @throws {Error} Propagates an error if the network request fails or returns a non-2xx status.
   * @returns {Promise<void>} Resolves when the internal level matrix is fully populated and ready for rendering.
   */
  async loadLevel(filePath) {
    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`Failed to load level: ${response.statusText}`);
      }

      const csvText = await response.text();
      // Converts raw CSV text into [[0,1,0], [1,1,1]] format
      this.level = CSV.parse_csv_from_string(csvText);
      this.isLoaded = true;

      console.log("Level loaded successfully:", this.level);
    } catch (error) {
      console.error("Map Load Error:", error);
    }
  }

  /**
   * Renders the current level matrix to the canvas.
   * Iterates through the 2D array and draws the mapped texture for each defined tile,
   * applying localized translations for precise positioning.
   * * @param {CanvasRenderingContext2D} ctx - The active 2D rendering context.
   */
  draw(ctx) {
    if (!this.isLoaded) return;

    for (let row = 0; row < this.level.length; row++) {
      for (let col = 0; col < this.level[row].length; col++) {
        
        const tileType = this.level[row][col];
        
        // Only draw if we have a texture for this tile ID
        if (this.textures[tileType]) {
          ctx.save();
          
          // Calculate pixel position based on grid coordinates
          const xPos = col * this.tileSize;
          const yPos = row * this.tileSize;
          
          ctx.translate(xPos, yPos);
          ctx.drawImage(
            this.textures[tileType],
            0, 0,
            this.tileSize, this.tileSize
          );
          
          ctx.restore();
        }
      }
    }
  }

  /**
   * Safely retrieves the tile ID at the specified grid coordinates.
   * Implements bounds checking to prevent array out-of-bounds exceptions, 
   * gracefully defaulting to a safe tile (grass/empty) if queried outside the map perimeter.
   * * @param {number} col - The X-axis grid index (column).
   * @param {number} row - The Y-axis grid index (row).
   * @returns {number} The integer ID of the tile at the specified location, or 0 if out of bounds.
   */
  getTile(col, row) {
    if (
      row >= 0 &&
      row < this.level.length &&
      col >= 0 &&
      col < this.level[0].length
    ) {
      return this.level[row][col];
    }
    return 0; // Return "Empty/Grass" if out of bounds
  }
}
