import {
  MeshBuilder,
  SceneLoader,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import { pieceAssets } from "./piece-data.js";

export const getBounds = (meshes) => {
  let min = new Vector3(Infinity, Infinity, Infinity);
  let max = new Vector3(-Infinity, -Infinity, -Infinity);
  meshes.forEach((mesh) => {
    if (!mesh.getBoundingInfo) return;
    mesh.refreshBoundingInfo(true);
    mesh.computeWorldMatrix(true);
    const bounds = mesh.getBoundingInfo().boundingBox;
    min = Vector3.Minimize(min, bounds.minimumWorld);
    max = Vector3.Maximize(max, bounds.maximumWorld);
  });
  return { min, max };
};

export const normalizeMeshes = (
  name,
  meshes,
  root,
  targetHeight,
  targetScene,
) => {
  if (meshes.length === 0) throw new Error(`No mesh data for ${name}`);

  const adjuster = new TransformNode(`${name}-adjuster`, targetScene);
  adjuster.parent = root;
  meshes.forEach((mesh) => mesh.setParent(adjuster));

  const bounds = getBounds(meshes);
  const height = bounds.max.y - bounds.min.y;
  if (!Number.isFinite(height) || height <= 0)
    throw new Error(`Invalid bounds for ${name}`);

  const scale = targetHeight / height;
  const center = bounds.min.add(bounds.max).scale(0.5);
  const bottomCenter = new Vector3(center.x, bounds.min.y, center.z);

  adjuster.scaling = new Vector3(scale, scale, scale);
  adjuster.position = bottomCenter.scale(-scale);
};

class PieceSource {
  constructor(name) {
    this.name = name;
  }
  describe() {
    return this.name;
  }
  async load() {
    throw new Error("PieceSource.load must be implemented");
  }
}

class AssetPieceSource extends PieceSource {
  constructor(name, file) {
    super(name);
    this.file = file;
  }
  describe() {
    return `${this.name} from ${this.file}`;
  }
  async load(scene) {
    const result = await SceneLoader.ImportMeshAsync(
      "",
      "/assets/",
      this.file,
      scene,
    );
    return result.meshes.filter(
      (m) => m.getTotalVertices && m.getTotalVertices() > 0,
    );
  }
}

class PrimitivePieceSource extends PieceSource {
  constructor(name, factory) {
    super(name);
    this.factory = factory;
  }
  describe() {
    return `${this.name} fallback`;
  }
  async load(scene) {
    return [this.factory(scene)];
  }
}

class PieceLibrary {
  constructor(scene, templateStore) {
    this.scene = scene;
    this.templateStore = templateStore;
    this.definitions = [];
  }

  addPiece(name, height, sources) {
    this.definitions.push({ name, height, sources });
  }

  registerFromMeshes(name, meshes, targetHeight) {
    const root = new TransformNode(`${name}-root`, this.scene);
    meshes.forEach((mesh) => (mesh.parent = root));
    normalizeMeshes(name, meshes, root, targetHeight, this.scene);
    root.setEnabled(false);
    this.templateStore[name] = root;
  }

  async loadAll() {
    for (const def of this.definitions) {
      let loaded = false;
      for (const source of def.sources) {
        try {
          console.log(`Loading asset: ${source.describe()}`);
          const meshes = await source.load(this.scene);
          this.registerFromMeshes(def.name, meshes, def.height);
          console.log(`Successfully loaded: ${def.name}`);
          loaded = true;
          break;
        } catch (err) {
          console.warn(`Failed to load ${source.describe()}:`, err);
        }
      }
      if (!loaded) console.error(`No mesh data for ${def.name}`);
    }
  }
}

export const buildPieceLibrary = (scene, templateStore) => {
  const library = new PieceLibrary(scene, templateStore);

  const cylinder = (name, height, top, bottom) =>
    new PrimitivePieceSource(name, (s) => {
      const m = MeshBuilder.CreateCylinder(
        `${name}Base`,
        { height, diameterTop: top, diameterBottom: bottom },
        s,
      );
      m.position.y = height * 0.5;
      return m;
    });

  const box = (name, height, width, depth) =>
    new PrimitivePieceSource(name, (s) => {
      const m = MeshBuilder.CreateBox(
        `${name}Base`,
        { height, width, depth },
        s,
      );
      m.position.y = height * 0.5;
      return m;
    });

  const sphere = (name, diameter) =>
    new PrimitivePieceSource(name, (s) => {
      const m = MeshBuilder.CreateSphere(`${name}Base`, { diameter }, s);
      m.position.y = diameter * 0.5;
      return m;
    });

  // ── Tier 1 ──
  library.addPiece("pawn", pieceAssets.pawn.height, [
    new AssetPieceSource("pawn", pieceAssets.pawn.file),
    cylinder("pawn", 1.2, 0.7, 0.9),
  ]);
  library.addPiece("vizier", pieceAssets.vizier.height, [
    new AssetPieceSource("vizier", pieceAssets.vizier.file),
    sphere("vizier", 1.0),
  ]);
  library.addPiece("knight", pieceAssets.knight.height, [
    new AssetPieceSource("knight", pieceAssets.knight.file),
    sphere("knight", 1.2),
  ]);
  library.addPiece("bishop", pieceAssets.bishop.height, [
    new AssetPieceSource("bishop", pieceAssets.bishop.file),
    cylinder("bishop", 1.6, 0.5, 0.9),
  ]);

  // ── Tier 2 ──
  library.addPiece("rook", pieceAssets.rook.height, [
    new AssetPieceSource("rook", pieceAssets.rook.file),
    box("rook", 1.4, 0.9, 0.9),
  ]);
  library.addPiece("camel", pieceAssets.camel.height, [
    new AssetPieceSource("camel", pieceAssets.camel.file),
    cylinder("camel", 1.6, 0.4, 1),
  ]);
  library.addPiece("wizzard", pieceAssets.wizzard.height, [
    new AssetPieceSource("wizzard", pieceAssets.wizzard.file),
    box("wizzard", 1.4, 1, 0.7),
  ]);
  library.addPiece("fool", pieceAssets.fool.height, [
    new AssetPieceSource("fool", pieceAssets.fool.file),
    sphere("fool", 1),
  ]);

  // ── Tier 3 ──
  library.addPiece("archbishop", pieceAssets.archbishop.height, [
    new AssetPieceSource("archbishop", pieceAssets.archbishop.file),
    cylinder("archbishop", 1.8, 0.5, 1),
  ]);
  library.addPiece("mammoth", pieceAssets.mammoth.height, [
    new AssetPieceSource("mammoth", pieceAssets.mammoth.file),
    cylinder("mammoth", 2, 1, 1.2),
  ]);

  // ── Tier 4 ──
  library.addPiece("chancellor", pieceAssets.chancellor.height, [
    new AssetPieceSource("chancellor", pieceAssets.chancellor.file),
    box("chancellor", 1.8, 1, 1),
  ]);
  library.addPiece("queen", pieceAssets.queen.height, [
    new AssetPieceSource("queen", pieceAssets.queen.file),
    cylinder("queen", 1.8, 0.8, 1),
  ]);
  library.addPiece("immobilizer", pieceAssets.immobilizer.height, [
    new AssetPieceSource("immobilizer", pieceAssets.immobilizer.file),
    box("immobilizer", 1.8, 1, 1),
  ]);

  // ── Tier 5 ──
  library.addPiece("amazon", pieceAssets.amazon.height, [
    new AssetPieceSource("amazon", pieceAssets.amazon.file),
    cylinder("amazon", 2.2, 0.8, 1.1),
  ]);

  return library;
};
