import * as CSV from "../../common/csv-parser.js";

/**
 * Enum mapping tile ID numbers to their logical names.
 * Used for debugging and texture lookups.
 */
export const tilesTypes = {
  grass: 0,
  brick: 1,
  water: 2,
  stone: 3,
};

export class Map {
  constructor(tileSize, textures) {
    this.tileSize = tileSize;
    this.textures = textures; // Array of Image objects

    this.level = []; // 2D Array representing the grid
    this.isLoaded = false;
  }

  /**
   * Fetches a CSV file and parses it into a 2D array.
   * @param {string} filePath - Path to the .csv level file
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
      // Optional: Logic to fallback to a default empty map could go here
    }
  }

  /**
   * Iterates through the 2D level array and renders tiles.
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
   * Safe accessor for tile data.
   * Returns 0 (default) if coordinates are out of bounds.
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
