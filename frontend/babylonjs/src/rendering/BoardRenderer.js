import { StandardMaterial, Color3, Vector3 } from "@babylonjs/core";
import { buildPieceLibrary } from "../pieces.js";

export class BoardRenderer {
  constructor({
    scene,
    board,
    pieceDefs,
    pieceYOffset,
    pieceYawFix,
    tileSize,
    offset,
    sounds,
  }) {
    this.scene = scene;
    this.board = board;
    this.pieceDefs = pieceDefs;
    this.pieceYOffset = pieceYOffset;
    this.pieceYawFix = pieceYawFix;
    this.tileSize = tileSize;
    this.offset = offset;
    this.sounds = sounds;

    this.analysisBarEl = document.getElementById("analysisBar");
    this.analysisFillEl = document.getElementById("analysisFill");

    this.baseWhite = new StandardMaterial("whitePiece", scene);
    this.baseWhite.diffuseColor = new Color3(0.95, 0.94, 0.9);
    this.baseWhite.specularColor = new Color3(0.2, 0.2, 0.2);

    this.baseBlack = new StandardMaterial("blackPiece", scene);
    this.baseBlack.diffuseColor = new Color3(0.33, 0.24, 0.19);
    this.baseBlack.specularColor = new Color3(0.08, 0.08, 0.08);

    this.ghostWhite = this.baseWhite.clone("ghostWhite");
    this.ghostWhite.alpha = 0.45;
    this.ghostWhite.backFaceCulling = false;

    this.ghostBlack = this.baseBlack.clone("ghostBlack");
    this.ghostBlack.alpha = 0.45;
    this.ghostBlack.backFaceCulling = false;

    this.pieceTemplates = {};
    this.lastEvalScore = null;
  }

  async loadPieces() {
    const library = buildPieceLibrary(this.scene, this.pieceTemplates);
    await library.loadAll();
  }

  get(squareId) {
    return this.board.get(squareId);
  }

  has(squareId) {
    return this.board.has(squareId);
  }

  snapshot() {
    return this.board.snapshot();
  }

  setLastEvalScore(score) {
    this.lastEvalScore = score;
    this.updateAnalysisBar();
  }

  clearLastEvalScore() {
    this.lastEvalScore = null;
    this.updateAnalysisBar();
  }

  setAnalysisVisible(visible) {
    this.analysisBarEl?.classList.toggle("hidden", !visible);
  }

  applyOpaqueMaterial(mesh, material) {
    mesh.material = material;
    mesh.hasVertexAlpha = false;
  }

  getSquarePosition(squareId, type) {
    const coords = this.board.getTileCoordinates(squareId);
    return {
      coords,
      x: coords.col * this.tileSize - this.offset,
      y: this.pieceYOffset[type] || 0,
      z: coords.zPos * this.tileSize - this.offset,
    };
  }

  syncMetadata(root, squareId) {
    root.getChildMeshes().forEach((mesh) => {
      mesh.metadata = { squareId, isPiece: true };
    });
  }

  syncEntryToSquare(squareId, entry) {
    if (!entry?.root) return;
    const position = this.getSquarePosition(squareId, entry.type);
    entry.root.position.set(position.x, position.y, position.z);
    this.syncMetadata(entry.root, squareId);
  }

  createPieceRoot(color, type, squareId) {
    const base = this.pieceTemplates[type];
    if (!base) return null;

    const instanceRoot = base.clone(`${color}-${type}-${squareId}`, null, false);
    instanceRoot.setEnabled(true);

    const position = this.getSquarePosition(squareId, type);
    instanceRoot.position.set(position.x, position.y, position.z);

    const baseYaw = this.pieceYawFix[type] || 0;
    instanceRoot.rotation = new Vector3(
      0,
      baseYaw + (color === "black" ? Math.PI : 0),
      0,
    );

    instanceRoot.getChildMeshes().forEach((mesh) => {
      this.applyOpaqueMaterial(mesh, color === "white" ? this.baseWhite : this.baseBlack);
      mesh.metadata = { squareId, isPiece: true };
    });

    return instanceRoot;
  }

  playSound(sound) {
    if (!sound) return;
    if (sound.isPlaying) sound.stop();
    sound.play();
  }

  placePiece(
    squareId,
    pieceId,
    {
      trackInventory = false,
      playSound = true,
    } = {},
  ) {
    if (!pieceId) return null;
    const [color, type] = pieceId.split("-");
    const coords = this.board.getTileCoordinates(squareId);
    if (
      type === "pawn" &&
      !coords.isBench &&
      (coords.row === 0 || coords.row === 7)
    ) {
      return null;
    }
    if (!this.board.isAllowedPlacement(color, squareId)) return null;

    this.removePiece(squareId);

    const root = this.createPieceRoot(color, type, squareId);
    if (!root) return null;

    const entry = {
      root,
      color,
      type,
      value: this.pieceDefs[type].value,
    };

    this.board.set(squareId, entry);
    if (trackInventory) {
      this.board.adjustBudget(color, -entry.value);
      this.board.counts[color][type] += 1;
    }

    if (playSound) this.playSound(this.sounds.move);
    this.updateAnalysisBar();
    return entry;
  }

  removePiece(
    squareId,
    isCombatDeath = false,
    softDelete = false,
    { trackInventory = false } = {},
  ) {
    const existing = this.board.get(squareId);
    if (!existing) return null;

    if (softDelete) existing.root.setEnabled(false);
    else existing.root.dispose();

    this.board.delete(squareId);
    if (!isCombatDeath && trackInventory) {
      this.board.adjustBudget(existing.color, existing.value);
      this.board.counts[existing.color][existing.type] = Math.max(
        0,
        this.board.counts[existing.color][existing.type] - 1,
      );
    }

    this.updateAnalysisBar();
    return existing;
  }

  movePiece(fromSq, toSq, { playSound = true } = {}) {
    if (fromSq === toSq) return false;
    const entry = this.board.get(fromSq);
    if (!entry || this.board.has(toSq)) return false;

    const toCoords = this.board.getTileCoordinates(toSq);
    if (!this.board.isAllowedPlacement(entry.color, toSq)) return false;
    if (
      entry.type === "pawn" &&
      !toCoords.isBench &&
      (toCoords.row === 0 || toCoords.row === 7)
    ) {
      return false;
    }

    this.syncEntryToSquare(toSq, entry);
    this.board.delete(fromSq);
    this.board.set(toSq, entry);

    if (playSound) this.playSound(this.sounds.move);
    this.updateAnalysisBar();
    return true;
  }

  createGhost(entry, squareId) {
    const ghost = entry.root.clone(
      `${entry.color}-${entry.type}-${squareId}-ghost`,
      null,
      false,
    );
    ghost.setEnabled(true);
    ghost.position.copyFrom(entry.root.position);
    ghost.rotation.copyFrom(entry.root.rotation);
    ghost.getChildMeshes().forEach((mesh) => {
      mesh.material = entry.color === "white" ? this.ghostWhite : this.ghostBlack;
      mesh.isPickable = false;
    });
    return ghost;
  }

  applyMoveVisuals(result) {
    if (!result?.pieceMoved) return;

    this.syncEntryToSquare(result.toSq, result.pieceMoved);

    if (result.promotionInfo?.newType) {
      const oldRoot = result.pieceMoved.root;
      const newRoot = this.createPieceRoot(
        result.pieceMoved.color,
        result.promotionInfo.newType,
        result.toSq,
      );
      if (newRoot) {
        oldRoot.setEnabled(false);
        result.pieceMoved.root = newRoot;
        result.promotionInfo.oldRoot = oldRoot;
        result.promotionInfo.newRoot = newRoot;
      }
    }

    if (result.sound === "promote") this.playSound(this.sounds.promote);
    else if (result.sound === "capture") this.playSound(this.sounds.capture);
    else if (result.sound === "castle") this.playSound(this.sounds.castle);
    else this.playSound(this.sounds.move);

    this.updateAnalysisBar();
  }

  updateAnalysisBar() {
    if (!this.analysisFillEl) return;
    let ratio = 0.5;

    if (this.lastEvalScore) {
      const { type, value } = this.lastEvalScore;
      if (type === "mate") ratio = value >= 0 ? 0.98 : 0.02;
      else ratio = (Math.min(1000, Math.max(-1000, value)) + 1000) / 2000;
    } else {
      let white = 0;
      let black = 0;
      this.board.forEach((entry, squareId) => {
        if (squareId.startsWith("bench")) return;
        if (entry.color === "white") white += entry.value;
        else black += entry.value;
      });
      const total = white + black;
      if (total > 0) ratio = white / total;
    }

    this.analysisFillEl.style.height = `${Math.round(
      Math.min(0.98, Math.max(0.02, ratio)) * 100,
    )}%`;
  }
}
