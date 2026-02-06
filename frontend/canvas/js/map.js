import * as CSV from "../../common/csv-parser.js";

export const tilesTypes = {
  grass: 0,
  stone: 1,
  brick: 2,
  water: 3,
};

export class Map {
  constructor(tileSize, textures) {
    this.tileSize = tileSize;
    this.textures = textures;

    this.level = [];
    this.isLoaded = false;
  }

  async loadLevel(filePath) {
    try {
      const response = await fetch(filePath);

      if (!response.ok) {
        throw new Error(`Failed to load level: ${response.statusText}`);
      }

      const csvText = await response.text();
      this.level = CSV.parse_csv_from_string(csvText);
      this.isLoaded = true;

      console.log("Level loaded:", this.level);
    } catch (error) {
      console.error(error);
      // Fallback to default level if file fails?
    }
  }

  draw(ctx) {
    for (let row = 0; row < this.level.length; row++) {
      for (let col = 0; col < this.level[row].length; col++) {
        const tileType = this.level[row][col];
        if (this.textures[tileType]) {
          ctx.drawImage(
            this.textures[tileType],
            col * this.tileSize,
            row * this.tileSize,
            this.tileSize,
            this.tileSize,
          );
        }
      }
    }
  }

  getTile(col, row) {
    if (
      row >= 0 &&
      row < this.level.length &&
      col >= 0 &&
      col < this.level[0].length
    ) {
      return this.level[row][col];
    }
    return 0;
  }
}
