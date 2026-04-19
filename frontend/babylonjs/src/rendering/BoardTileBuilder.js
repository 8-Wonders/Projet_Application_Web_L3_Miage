import {
  MeshBuilder,
  StandardMaterial,
  Color3,
  TransformNode,
} from "@babylonjs/core";

export class BoardTileBuilder {
  constructor({ scene, tileSize = 1.8 }) {
    this.scene = scene;
    this.tileSize = tileSize;
    this.offset = (7 * tileSize) / 2;
  }

  buildAll() {
    const boardRoot = new TransformNode("boardRoot", this.scene);
    const benchTiles = [];

    const lightTile = new StandardMaterial("lightTile", this.scene);
    lightTile.diffuseColor = new Color3(0.91, 0.87, 0.8);
    const darkTile = new StandardMaterial("darkTile", this.scene);
    darkTile.diffuseColor = new Color3(0.33, 0.24, 0.19);
    const benchMaterial = new StandardMaterial("benchMaterial", this.scene);
    benchMaterial.diffuseColor = new Color3(0.5, 0.5, 0.6);

    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const tile = MeshBuilder.CreateBox(
          `tile-${row}-${col}`,
          { width: this.tileSize, depth: this.tileSize, height: 0.2 },
          this.scene,
        );
        tile.position.set(
          col * this.tileSize - this.offset,
          -0.1,
          row * this.tileSize - this.offset,
        );
        tile.material = (row + col) % 2 === 0 ? lightTile : darkTile;
        tile.metadata = { squareId: `${row}-${col}` };
        tile.isPickable = true;
        tile.parent = boardRoot;
      }
    }

    for (let col = 0; col < 8; col += 1) {
      const tile = MeshBuilder.CreateBox(
        `bench-tile-${col}`,
        { width: this.tileSize, depth: this.tileSize, height: 0.15 },
        this.scene,
      );
      tile.position.set(
        col * this.tileSize - this.offset,
        -0.1,
        8.5 * this.tileSize - this.offset,
      );
      tile.material = benchMaterial;
      tile.metadata = { squareId: `bench-${col}`, isBench: true };
      tile.isPickable = true;
      tile.parent = boardRoot;
      benchTiles.push(tile);
    }

    return {
      benchTiles,
      tileSize: this.tileSize,
      offset: this.offset,
    };
  }

  positionBenchTilesForColor(benchTiles, color) {
    const benchZ = color === "black" ? -1.5 : 8.5;
    benchTiles.forEach((tile) => {
      tile.position.z = benchZ * this.tileSize - this.offset;
    });
  }
}
