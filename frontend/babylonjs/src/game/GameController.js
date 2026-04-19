import { pieceDefs, pieceLabels, pieceMoves, pieceAssets, pieceYawFix, pieceYOffset } from "../piece-data.js";
import { generateFEN } from "./fen.js";
import { BoardTileBuilder } from "../rendering/BoardTileBuilder.js";
import { EngineClient } from "./engine-client.js";
import { UIManager } from "../ui/ui-manager.js";
import { Board } from "../domain/Board.js";
import { GameState } from "../domain/GameState.js";
import { Shop } from "../domain/Shop.js";
import { CombatRecord } from "../domain/CombatRecord.js";
import { AIService } from "../services/AIService.js";
import { ReviewService } from "../services/ReviewService.js";
import { BoardRenderer } from "../rendering/BoardRenderer.js";
import { PreviewRenderer } from "../rendering/PreviewRenderer.js";
import { TimerDisplay } from "../rendering/TimerDisplay.js";
import { CombatService } from "../services/CombatService.js";
import { DragController } from "../input/DragController.js";

const getPlayerTotalGold = (level) => 10 + (level - 1) * 5;
const getAIBudget = (playerGold) => playerGold + 2;

export class GameController {
  constructor({ sceneManager, canvas, previewCanvas, previewNameEl }) {
    this.sceneManager = sceneManager;
    this.canvas = canvas;
    this.previewCanvas = previewCanvas;
    this.previewNameEl = previewNameEl;

    this.engine = sceneManager.engine;
    this.scene = sceneManager.scene;

    this.uiManager = new UIManager({ pieceDefs, pieceLabels, pieceMoves });
    this.playerState = new GameState({ gold: 10, hp: 100, level: 1 });
    this.board = new Board({ pieceDefs });
    this.shop = new Shop({ pieceDefs, tier: 1, maxTier: 5 });
    this.combatRecord = new CombatRecord();
    this.aiService = new AIService({ pieceDefs });
    this.reviewService = new ReviewService({ combatRecord: this.combatRecord });

    this.camera = null;
    this.previewRenderer = null;
    this.boardRenderer = null;
    this.timerDisplay = null;
    this.combatService = null;
    this.dragController = null;
    this.benchTiles = [];

    this.playerColor = null;
    this.aiColor = null;
    this.selectedPiece = null;
  }

  async init() {
    this.#configureBrowserEvents();
    await this.#createScene();
    this.#wireUi();
    this.#wireKeyboardReviewControls();
    await this.boardRenderer.loadPieces();
    this.previewRenderer.init();
    this.generateShopItems();
    this.engine.runRenderLoop(() => this.scene.render());
    window.addEventListener("resize", () => {
      this.engine.resize();
      this.previewRenderer?.engine?.resize();
    });
  }

  #configureBrowserEvents() {
    this.canvas?.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener(
      "wheel",
      (event) => {
        if (event.ctrlKey) event.preventDefault();
      },
      { passive: false },
    );
    ["gesturestart", "gesturechange", "gestureend"].forEach((type) =>
      window.addEventListener(type, (event) => event.preventDefault(), {
        passive: false,
      }),
    );
  }

  async #createScene() {
    this.camera = this.sceneManager.createCamera(this.canvas);
    this.sceneManager.createLights();
    const sounds = this.sceneManager.createSounds();
    this.unlockAudio = this.sceneManager.unlockAudioOnFirstInteraction(this.canvas);

    this.tileBuilder = new BoardTileBuilder({ scene: this.scene });
    const { benchTiles, tileSize, offset } = this.tileBuilder.buildAll();
    this.benchTiles = benchTiles;

    this.board.setBudget("white", getPlayerTotalGold(this.playerState.level));
    this.board.setBudget("black", getAIBudget(this.playerState.gold));

    this.boardRenderer = new BoardRenderer({
      scene: this.scene,
      board: this.board,
      pieceDefs,
      pieceYOffset,
      pieceYawFix,
      tileSize,
      offset,
      sounds,
    });

    this.previewRenderer = new PreviewRenderer({
      canvas: this.previewCanvas,
      nameEl: this.previewNameEl,
      pieceAssets,
      pieceLabels,
    });

    this.timerDisplay = new TimerDisplay({ container: document.body });

    this.combatService = new CombatService({
      board: this.board,
      playerState: this.playerState,
      combatRecord: this.combatRecord,
      engineClient: new EngineClient(
        new URL("/engine/chess-worker.js", window.location.origin),
      ),
      boardRenderer: this.boardRenderer,
      timerDisplay: this.timerDisplay,
      uiManager: this.uiManager,
      pieceDefs,
      generateFEN,
    });

    this.dragController = new DragController({
      scene: this.scene,
      camera: this.camera,
      board: this.board,
      boardRenderer: this.boardRenderer,
      uiManager: this.uiManager,
      playerState: this.playerState,
      pieceDefs,
      shop: this.shop,
      getUpgradeCost: () => this.getUpgradeCost(),
    });

    this.dragController.onSellPiece = () => {
      this.uiManager.renderShop(
        this.shop.currentShop,
        this.playerState,
        this.shop.tier,
        this.getUpgradeCost(),
      );
    };
    this.dragController.onBeforePointerDown = () => {
      if (this.combatRecord.isReviewing) this.exitReviewMode();
    };

    this.combatService.onRoundEnd = ({ playerWon, damageTaken }) => {
      this.dragController.attach();
      this.generateShopItems();
      this.board.setBudget("black", getAIBudget(this.playerState.gold));
      this.board.resetCounts(this.aiColor);
      this.randomizeAI();
      this.uiManager.renderShop(
        this.shop.currentShop,
        this.playerState,
        this.shop.tier,
        this.getUpgradeCost(),
      );
    };

    this.dragController.attach();
  }

  #wireUi() {
    this.uiManager.onUpgradeShop = () => this.upgradeShop();
    this.uiManager.onBuyPiece = (shopIndex) => this.buyFromShop(shopIndex);
    this.uiManager.onReroll = () => this.rerollShop();
    this.uiManager.onPickSide = (color) => this.setSide(color);
    this.uiManager.onClearBoard = () => {
      if (this.combatRecord.isReviewing) this.exitReviewMode();
      if (this.playerColor) this.moveColorToBench(this.playerColor);
    };
    this.uiManager.onPieceSelected = (pieceId) => {
      this.selectedPiece = pieceId;
      if (!pieceId) return;
      const [color, type] = pieceId.split("-");
      this.previewRenderer.update(type, color);
    };
    this.uiManager.onStartBattle = () => this.startBattle();
    this.uiManager.onPrevTurn = () => this.undoMove();
    this.uiManager.onNextTurn = () => this.redoMove();
    this.uiManager.onExitReview = () => this.exitReviewMode();
  }

  #wireKeyboardReviewControls() {
    document.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
      }

      if (!this.combatService.gameInProgress && this.combatRecord.length === 0) return;
      if (event.key === "ArrowLeft") this.undoMove();
      if (event.key === "ArrowRight") this.redoMove();
      if (event.key === "ArrowUp") this.goToFirstMove();
      if (event.key === "ArrowDown") this.goToLastMove();
    });
  }

  getUpgradeCost() {
    return this.shop.getUpgradeCost(this.playerState.level);
  }

  generateShopItems() {
    this.shop.generate();
    this.uiManager.clearShopSelection();
    this.uiManager.renderShop(
      this.shop.currentShop,
      this.playerState,
      this.shop.tier,
      this.getUpgradeCost(),
    );
  }

  upgradeShop() {
    if (this.shop.tier >= this.shop.maxTier) return;
    if (!this.shop.upgrade(this.playerState)) {
      this.uiManager.showToast("Not enough gold to upgrade the shop!");
      return;
    }

    this.uiManager.showToast(
      `Shop upgraded to Tier ${this.shop.tier}! Stronger pieces unlocked.`,
    );
    this.uiManager.clearShopSelection();
    this.uiManager.renderShop(
      this.shop.currentShop,
      this.playerState,
      this.shop.tier,
      this.getUpgradeCost(),
    );
  }

  rerollShop() {
    if (this.combatRecord.isReviewing) this.exitReviewMode();
    if (!this.shop.reroll(this.playerState)) {
      this.uiManager.showToast("Not enough gold to reroll!");
      return;
    }
    this.uiManager.clearShopSelection();
    this.uiManager.renderShop(
      this.shop.currentShop,
      this.playerState,
      this.shop.tier,
      this.getUpgradeCost(),
    );
  }

  buyFromShop(shopIndex) {
    if (this.combatRecord.isReviewing) this.exitReviewMode();
    const type = this.shop.get(shopIndex);
    if (!type || !this.playerColor) return;

    const cost = pieceDefs[type].value;
    if (!this.playerState.deductGold(cost)) {
      this.uiManager.showToast("Not enough gold!");
      return;
    }

    const emptyBenchSquare = this.board.findFirstEmptyBenchSquare();
    if (!emptyBenchSquare) {
      this.playerState.addGold(cost);
      this.uiManager.showToast("Your bench is full!");
      return;
    }

    this.shop.markSold(shopIndex);
    this.selectedPiece = `${this.playerColor}-${type}`;
    this.boardRenderer.placePiece(emptyBenchSquare, this.selectedPiece);
    this.selectedPiece = null;

    this.uiManager.renderShop(
      this.shop.currentShop,
      this.playerState,
      this.shop.tier,
      this.getUpgradeCost(),
    );
  }

  positionBenchTiles(color) {
    this.tileBuilder.positionBenchTilesForColor(this.benchTiles, color);
  }

  clearColor(color, { trackInventory = false } = {}) {
    const toRemove = [];
    this.board.forEach((entry, squareId) => {
      if (entry.color === color) toRemove.push(squareId);
    });
    toRemove.forEach((squareId) => {
      this.boardRenderer.removePiece(squareId, false, false, { trackInventory });
    });
  }

  moveColorToBench(color) {
    let benchFull = false;
    const moves = [];
    this.board.forEach((entry, squareId) => {
      if (entry.color === color && !squareId.startsWith("bench")) {
        const benchSquare = this.board.findFirstEmptyBenchSquare();
        if (benchSquare) moves.push([squareId, benchSquare]);
        else benchFull = true;
      }
    });
    moves.forEach(([fromSq, toSq]) => this.boardRenderer.movePiece(fromSq, toSq));
    if (benchFull) {
      this.uiManager.showToast("Bench is full! Some pieces remained on board.");
    }
  }

  randomizeAI() {
    if (!this.aiColor) return;
    this.clearColor(this.aiColor, { trackInventory: true });
    this.board.setBudget(this.aiColor, getAIBudget(this.playerState.gold));
    this.board.resetCounts(this.aiColor);

    const placements = this.aiService.planPlacement({
      color: this.aiColor,
      board: this.board,
      shopTier: this.shop.tier,
    });

    placements.forEach(({ squareId, type }) => {
      this.boardRenderer.placePiece(squareId, `${this.aiColor}-${type}`, {
        trackInventory: true,
      });
    });

    this.uiManager.clearSelection();
  }

  setSide(color) {
    this.playerColor = color;
    this.aiColor = color === "white" ? "black" : "white";

    this.board.setPlayerColor(this.playerColor);
    this.uiManager.setPlayerColor(this.playerColor);
    this.uiManager.setSidePickerVisible(false);
    this.dragController.setPlayerColor(this.playerColor);
    this.combatService.setSides({
      playerColor: this.playerColor,
      aiColor: this.aiColor,
    });

    this.selectedPiece = null;
    this.uiManager.clearSelection();
    this.positionBenchTiles(this.playerColor);

    const toDispose = [];
    this.board.forEach((entry, squareId) => {
      toDispose.push(squareId);
      entry.root.dispose();
    });
    toDispose.forEach((squareId) => this.board.delete(squareId));

    this.board.setBudget("white", getPlayerTotalGold(this.playerState.level));
    this.board.setBudget("black", getAIBudget(this.playerState.gold));
    this.board.resetCounts("white");
    this.board.resetCounts("black");

    this.uiManager.renderShop(
      this.shop.currentShop,
      this.playerState,
      this.shop.tier,
      this.getUpgradeCost(),
    );
    this.randomizeAI();
  }

  startBattle() {
    if (!this.playerColor) {
      this.uiManager.showToast("Pick a side before starting the battle.");
      return;
    }
    if (this.combatRecord.isReviewing) this.exitReviewMode();
    if (this.combatService.gameInProgress) return;

    let hasBoardPieces = false;
    let hasBenchPieces = false;
    this.board.forEach((entry, squareId) => {
      if (entry.color !== this.playerColor) return;
      if (squareId.startsWith("bench")) hasBenchPieces = true;
      else hasBoardPieces = true;
    });

    if (!hasBoardPieces) {
      const cheapestShopPrice = this.shop.currentShop.reduce((min, type) => {
        if (!type) return min;
        return Math.min(min, pieceDefs[type].value);
      }, Infinity);

      if (!hasBenchPieces && !this.playerState.canAfford(cheapestShopPrice)) {
        this.uiManager.showToast("No pieces and out of gold! Forfeiting the round...");
        this.combatService.resolveAnnihilation();
        return;
      }

      this.uiManager.showToast("Place at least one piece on the board to fight!");
      return;
    }

    this.unlockAudio?.();
    this.dragController.detach();
    this.combatService.start();
  }

  exitReviewMode() {
    const nextRoundSnapshot = this.reviewService.exitReview(this.board.snapshot());
    if (!nextRoundSnapshot) return;

    this.board.forEach((entry, squareId) => {
      if (!squareId.startsWith("bench")) entry.root.setEnabled(false);
    });

    this.board.clear();
    nextRoundSnapshot.forEach((entry, squareId) => {
      this.board.set(squareId, entry);
      if (!squareId.startsWith("bench")) entry.root.setEnabled(true);
    });

    this.uiManager.updatePlaybackUI(
      this.combatRecord.currentPlyIndex,
      this.combatRecord.length,
      this.combatRecord.isReviewing,
    );
    this.boardRenderer.updateAnalysisBar();
  }

  undoMove() {
    if (this.combatService.gameInProgress) {
      this.uiManager.showToast("Wait for the round to end to review moves!");
      return;
    }
    if (!this.reviewService.canUndo({ gameInProgress: false })) return;

    if (this.reviewService.ensureReviewSnapshot(this.board.snapshot())) {
      this.board.forEach((entry, squareId) => {
        if (!squareId.startsWith("bench")) entry.root.setEnabled(false);
      });
      this.board.clear();
      this.combatRecord.battleEndPlacedPieces.forEach((entry, squareId) => {
        this.board.set(squareId, entry);
        if (!squareId.startsWith("bench")) entry.root.setEnabled(true);
      });
    }

    const move = this.reviewService.getPreviousMove();
    this.boardRenderer.applyUndoVisuals(move);

    this.board.delete(move.toSq);
    this.board.set(move.fromSq, move.pieceMoved);

    if (move.capturedPiece) {
      const restoreSq = move.enPassantSq || move.toSq;
      this.board.set(restoreSq, move.capturedPiece);
    }

    this.reviewService.stepBackward();
    this.combatRecord.enterReview();
    this.uiManager.updatePlaybackUI(
      this.combatRecord.currentPlyIndex,
      this.combatRecord.length,
      this.combatRecord.isReviewing,
    );
    this.boardRenderer.playSound(this.boardRenderer.sounds.move);
    this.boardRenderer.updateAnalysisBar();
  }

  redoMove() {
    if (this.combatService.gameInProgress) {
      this.uiManager.showToast("Wait for the round to end to review moves!");
      return;
    }
    if (!this.reviewService.canRedo({ gameInProgress: false })) return;

    if (this.reviewService.ensureReviewSnapshot(this.board.snapshot())) {
      this.board.forEach((entry, squareId) => {
        if (!squareId.startsWith("bench")) entry.root.setEnabled(false);
      });
      this.board.clear();
      this.combatRecord.battleEndPlacedPieces.forEach((entry, squareId) => {
        this.board.set(squareId, entry);
        if (!squareId.startsWith("bench")) entry.root.setEnabled(true);
      });
    }

    const move = this.reviewService.getNextMove();

    if (move.capturedPiece) {
      this.board.delete(move.enPassantSq || move.toSq);
    }

    this.boardRenderer.applyRedoVisuals(move);

    this.board.delete(move.fromSq);
    this.board.set(move.toSq, move.pieceMoved);

    this.reviewService.stepForward();
    this.combatRecord.enterReview();
    this.uiManager.updatePlaybackUI(
      this.combatRecord.currentPlyIndex,
      this.combatRecord.length,
      this.combatRecord.isReviewing,
    );
    this.boardRenderer.playSound(this.boardRenderer.sounds.move);
    this.boardRenderer.updateAnalysisBar();
  }

  goToFirstMove() {
    if (!this.combatService.gameInProgress && this.combatRecord.length > 0) {
      while (this.combatRecord.currentPlyIndex > 0) this.undoMove();
    }
  }

  goToLastMove() {
    if (!this.combatService.gameInProgress && this.combatRecord.length > 0) {
      while (this.combatRecord.currentPlyIndex < this.combatRecord.length) this.redoMove();
    }
  }
}
