export class Map {
  constructor(tileSize, textures) {
    this.tileSize = tileSize;
    this.textures = textures;

    // 0 = Grass (Walkable), 1 = Wall (Solid), 2 = Water (Solid/Hazard), 3 = Stone (Solid)
    this.level = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 3, 3, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 3, 3, 0, 1],
      [1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1],
    ];
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
            this.tileSize
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
