import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  StandardMaterial,
  Color3,
  TransformNode,
  SceneLoader,
  MeshBuilder,
} from "@babylonjs/core";
import { getBounds, normalizeMeshes } from "../pieces.js";

export class PreviewRenderer {
  constructor({ canvas, nameEl, pieceAssets, pieceLabels }) {
    this.canvas = canvas;
    this.nameEl = nameEl;
    this.pieceAssets = pieceAssets;
    this.pieceLabels = pieceLabels;

    this.engine = null;
    this.scene = null;
    this.root = null;
    this.camera = null;
    this.whiteMaterial = null;
    this.blackMaterial = null;
  }

  init() {
    if (!this.canvas) return;

    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);
    this.camera = new ArcRotateCamera(
      "previewCamera",
      Math.PI / 2,
      Math.PI / 3,
      4,
      Vector3.Zero(),
      this.scene,
    );
    this.camera.inputs.clear();

    const light = new HemisphericLight(
      "previewLight",
      new Vector3(0, 1, 0),
      this.scene,
    );
    light.intensity = 0.95;

    this.whiteMaterial = new StandardMaterial("previewWhite", this.scene);
    this.whiteMaterial.diffuseColor = new Color3(0.95, 0.94, 0.9);
    this.whiteMaterial.specularColor = new Color3(0.2, 0.2, 0.2);

    this.blackMaterial = new StandardMaterial("previewBlack", this.scene);
    this.blackMaterial.diffuseColor = new Color3(0.33, 0.24, 0.19);
    this.blackMaterial.specularColor = new Color3(0.08, 0.08, 0.08);

    this.scene.onBeforeRenderObservable.add(() => {
      if (this.root) this.root.rotation.y += 0.01;
    });

    this.engine.runRenderLoop(() => this.scene.render());
  }

  async update(type, color) {
    if (!this.canvas || !this.scene || !this.camera) return;
    const asset = this.pieceAssets[type];
    if (!asset) return;

    if (this.root) {
      this.root.dispose();
      this.root = null;
    }

    this.root = new TransformNode(`preview-${type}`, this.scene);
    if (this.nameEl) this.nameEl.textContent = this.pieceLabels[type] || type;

    let meshes = [];
    try {
      const result = await SceneLoader.ImportMeshAsync("", "/assets/", asset.file, this.scene);
      meshes = result.meshes.filter((mesh) => mesh.getTotalVertices && mesh.getTotalVertices() > 0);
      meshes.forEach((mesh) => {
        mesh.parent = this.root;
      });
      normalizeMeshes(`preview-${type}`, meshes, this.root, asset.height, this.scene);
    } catch {
      const fallback = MeshBuilder.CreateCylinder(
        `preview-${type}-fallback`,
        { height: asset.height, diameterTop: 0.8, diameterBottom: 1 },
        this.scene,
      );
      meshes = [fallback];
      normalizeMeshes(`preview-${type}`, meshes, this.root, asset.height, this.scene);
    }

    const material = color === "black" ? this.blackMaterial : this.whiteMaterial;
    if (material) {
      meshes.forEach((mesh) => {
        mesh.material = material;
      });
    }

    const bounds = getBounds(this.root.getChildMeshes());
    const center = bounds.min.add(bounds.max).scale(0.5);
    const size = bounds.max.subtract(bounds.min);
    this.camera.setTarget(center);
    this.camera.radius = Math.max(3, Math.max(size.x, size.y, size.z) * 2.4);
  }
}
