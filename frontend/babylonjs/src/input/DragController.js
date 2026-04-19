import { PointerEventTypes } from "@babylonjs/core";
import { gemIcon } from "../ui/icons.js";

export class DragController {
  constructor({
    scene,
    camera,
    board,
    boardRenderer,
    uiManager,
    playerState,
    pieceDefs,
    shop,
    getUpgradeCost,
  }) {
    this.scene = scene;
    this.camera = camera;
    this.board = board;
    this.boardRenderer = boardRenderer;
    this.uiManager = uiManager;
    this.playerState = playerState;
    this.pieceDefs = pieceDefs;
    this.shop = shop;
    this.getUpgradeCost = getUpgradeCost;

    this.playerColor = "white";
    this.onSellPiece = null;
    this.onBeforePointerDown = null;
    this.observer = null;
  }

  setPlayerColor(color) {
    this.playerColor = color;
  }

  attach() {
    if (this.observer) return;

    this.observer = this.scene.onPointerObservable.add((pointerInfo) => {
      const isDown = pointerInfo.type === PointerEventTypes.POINTERDOWN;
      const isUp = pointerInfo.type === PointerEventTypes.POINTERUP;
      const isMove = pointerInfo.type === PointerEventTypes.POINTERMOVE;
      if (!isDown && !isUp && !isMove) return;

      if (!this.scene.metadata) this.scene.metadata = {};
      if (!this.scene.metadata.dragState) {
        this.scene.metadata.dragState = {
          active: false,
          fromSq: null,
          toSq: null,
          entry: null,
          ghost: null,
          sellValue: 0,
        };
      }

      const dragState = this.scene.metadata.dragState;

      if (isDown) {
        this.onBeforePointerDown?.();
      }

      if (isDown && pointerInfo.event?.button === 2) {
        const pick = this.scene.pick(
          this.scene.pointerX,
          this.scene.pointerY,
          (mesh) => !!mesh.metadata?.isPiece,
        );
        if (pick?.hit && pick.pickedMesh?.metadata?.squareId) {
          const entry = this.board.get(pick.pickedMesh.metadata.squareId);
          if (entry) {
            this.uiManager.showMoveModal(
              `${this.uiManager.pieceLabels[entry.type] || entry.type} (Cost: ${gemIcon} ${entry.value})`,
              this.uiManager.pieceMoves[entry.type] || "No movement info available.",
            );
          }
        }
        return;
      }

      if (isDown) {
        const pick = this.scene.pick(
          this.scene.pointerX,
          this.scene.pointerY,
          (mesh) => !!mesh.metadata?.isPiece,
        );
        if (pick?.hit && pick.pickedMesh?.metadata?.squareId) {
          const squareId = pick.pickedMesh.metadata.squareId;
          const entry = this.board.get(squareId);
          if (entry && entry.color === this.playerColor) {
            dragState.active = true;
            dragState.fromSq = squareId;
            dragState.entry = entry;
            dragState.ghost = this.boardRenderer.createGhost(entry, squareId);
            dragState.sellValue = Math.max(1, Math.floor(entry.value * 0.7));
            this.uiManager.showSellZone(dragState.sellValue);
            this.camera.detachControl();
          }
        }
        return;
      }

      if (isMove && dragState.active) {
        const px = pointerInfo.event?.clientX ?? 0;
        const py = pointerInfo.event?.clientY ?? 0;
        this.uiManager.highlightSellZone(this.uiManager.isPointerOverSellZone(px, py));

        const pick = this.scene.pick(
          this.scene.pointerX,
          this.scene.pointerY,
          (mesh) => !!mesh.metadata?.squareId && !mesh.metadata?.isPiece,
        );
        if (!pick?.hit || !pick.pickedMesh?.metadata?.squareId) return;
        const squareId = pick.pickedMesh.metadata.squareId;
        if (!this.board.isAllowedPlacement(dragState.entry.color, squareId)) return;

        const position = this.boardRenderer.getSquarePosition(squareId, dragState.entry.type);
        dragState.ghost.position.set(position.x, position.y, position.z);
        dragState.toSq = squareId;
        return;
      }

      if (isUp && dragState.active) {
        const px = pointerInfo.event?.clientX ?? 0;
        const py = pointerInfo.event?.clientY ?? 0;

        if (this.uiManager.isPointerOverSellZone(px, py)) {
          this.playerState.addGold(dragState.sellValue);
          this.boardRenderer.removePiece(dragState.fromSq);
          this.boardRenderer.playSound(this.boardRenderer.sounds.capture);
          this.onSellPiece?.();
        } else {
          const targetSq = dragState.toSq || dragState.fromSq;
          if (targetSq && targetSq !== dragState.fromSq && !this.board.has(targetSq)) {
            this.boardRenderer.movePiece(dragState.fromSq, targetSq);
          }
        }

        if (dragState.ghost) dragState.ghost.dispose();
        this.uiManager.hideSellZone();
        this.camera.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
        Object.assign(dragState, {
          active: false,
          fromSq: null,
          toSq: null,
          entry: null,
          ghost: null,
          sellValue: 0,
        });
      }
    });
  }

  detach() {
    if (!this.observer) return;
    this.scene.onPointerObservable.remove(this.observer);
    this.observer = null;
  }
}
