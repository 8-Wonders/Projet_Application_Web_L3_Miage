import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  PointerEventTypes,
  StandardMaterial,
  Color3,
  TransformNode,
  SceneLoader,
  Sound,
} from "@babylonjs/core";
import "@babylonjs/core/Audio/audioEngine";
import "@babylonjs/loaders";
import "./style.css";
import {
  pieceAssets,
  pieceDefs,
  pieceLabels,
  pieceMoves,
  pieceYawFix,
  pieceYOffset,
} from "./piece-data.js";
import { buildPieceLibrary, getBounds, normalizeMeshes } from "./pieces.js";
import { generateFEN } from "./game/fen.js";
import { EngineClient } from "./game/engine-client.js";
import { gemIcon } from "./ui/icons.js";
import { UIManager } from "./ui/ui-manager.js";

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true, { audioEngine: true });
const previewCanvas = document.getElementById("previewCanvas");
const previewNameEl = document.getElementById("previewName");
const analysisBarEl = document.getElementById("analysisBar");
const analysisFillEl = document.getElementById("analysisFill");
const uiManager = new UIManager({ pieceDefs, pieceLabels, pieceMoves });

let previewEngine = null;
let previewScene = null;
let previewRoot = null;
let previewCamera = null;

let detailedHistory = [];
let battleEndPlacedPieces = new Map();
let savedNextRoundPieces = new Map();
let currentPlyIndex = 0;
let isReviewing = false;

// ── Timer UI ──────────────────────────────────────────────────────────────────
const timerContainer = document.createElement("div");
timerContainer.id = "chess-timers";
Object.assign(timerContainer.style, {
  position: "absolute",
  top: "20px",
  left: "50%",
  transform: "translateX(-50%)",
  display: "none",
  flexDirection: "row",
  gap: "12px",
  zIndex: "1000",
  fontFamily: "'Space Grotesk', monospace",
  fontSize: "20px",
  fontWeight: "600",
  pointerEvents: "none",
});

const makeTimerEl = (color) => {
  const el = document.createElement("div");
  Object.assign(el.style, {
    backgroundColor: "rgba(17, 24, 42, 0.85)",
    color: color === "white" ? "#e5e7ef" : "#8ea1c8",
    padding: "6px 14px",
    borderRadius: "12px",
    border: "1px solid #2a3555",
    backdropFilter: "blur(8px)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
  });
  el.innerText = "[03:00]";
  return el;
};

const whiteTimerEl = makeTimerEl("white");
const blackTimerEl = makeTimerEl("black");
timerContainer.appendChild(whiteTimerEl);
timerContainer.appendChild(blackTimerEl);
document.body.appendChild(timerContainer);

let timeWhite = 180,
  timeBlack = 180,
  timerInterval = null;

const updateTimerVisuals = (turn) => {
  whiteTimerEl.style.borderColor = turn === "white" ? "#4c6fff" : "#2a3555";
  whiteTimerEl.style.color = turn === "white" ? "#fff" : "#e5e7ef";
  blackTimerEl.style.borderColor = turn === "black" ? "#4c6fff" : "#2a3555";
  blackTimerEl.style.color = turn === "black" ? "#fff" : "#8ea1c8";
};
// ─────────────────────────────────────────────────────────────────────────────

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
window.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) e.preventDefault();
  },
  { passive: false },
);
["gesturestart", "gesturechange", "gestureend"].forEach((t) =>
  window.addEventListener(t, (e) => e.preventDefault(), { passive: false }),
);

const createScene = async () => {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 4,
    Math.PI / 3,
    18,
    Vector3.Zero(),
    scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = 0.3;
  camera.upperBetaLimit = 1.2;
  camera.wheelDeltaPercentage = 0.01;
  if (camera.inputs.attached.keyboard)
    camera.inputs.remove(camera.inputs.attached.keyboard);

  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  const sounds = {
    move: new Sound("move-self", "/assets/sounds/move-self.mp3", scene, null, {
      volume: 0.4,
    }),
    capture: new Sound("capture", "/assets/sounds/capture.mp3", scene, null, {
      volume: 0.5,
    }),
    castle: new Sound("castle", "/assets/sounds/castle.mp3", scene, null, {
      volume: 0.5,
    }),
    promote: new Sound("promote", "/assets/sounds/promote.mp3", scene, null, {
      volume: 0.55,
    }),
  };

  const playSound = (sound) => {
    if (!sound) return;
    if (sound.isPlaying) sound.stop();
    sound.play();
  };

  const unlockAudio = () => {
    const ae = Engine.audioEngine || engine.getAudioEngine?.();
    if (ae && !ae.unlocked) ae.unlock();
  };
  canvas.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });

  const getPlayerTotalGold = (level) => 10 + (level - 1) * 5;
  const getAIBudget = (playerGold) => playerGold + 2;

  // ── Board ──
  const boardRoot = new TransformNode("boardRoot", scene);
  const lightTile = new StandardMaterial("lightTile", scene);
  lightTile.diffuseColor = new Color3(0.91, 0.87, 0.8);
  const darkTile = new StandardMaterial("darkTile", scene);
  darkTile.diffuseColor = new Color3(0.33, 0.24, 0.19);

  const tileSize = 1.8;
  const offset = (7 * tileSize) / 2;
  const tiles = [];

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const tile = MeshBuilder.CreateBox(
        `tile-${row}-${col}`,
        { width: tileSize, depth: tileSize, height: 0.2 },
        scene,
      );
      tile.position.set(col * tileSize - offset, -0.1, row * tileSize - offset);
      tile.material = (row + col) % 2 === 0 ? lightTile : darkTile;
      tile.metadata = { squareId: `${row}-${col}` };
      tile.isPickable = true;
      tile.parent = boardRoot;
      tiles.push(tile);
    }
  }

  const benchMaterial = new StandardMaterial("benchMaterial", scene);
  benchMaterial.diffuseColor = new Color3(0.5, 0.5, 0.6);

  const getBenchZPosForColor = (color) => (color === "black" ? -1.5 : 8.5);
  const benchTiles = [];

  for (let col = 0; col < 8; col++) {
    const tile = MeshBuilder.CreateBox(
      `bench-tile-${col}`,
      { width: tileSize, depth: tileSize, height: 0.15 },
      scene,
    );
    tile.position.set(
      col * tileSize - offset,
      -0.1,
      getBenchZPosForColor("white") * tileSize - offset,
    );
    tile.material = benchMaterial;
    tile.metadata = { squareId: `bench-${col}`, isBench: true };
    tile.isPickable = true;
    tile.parent = boardRoot;
    benchTiles.push(tile);
  }

  // ── Materials ──
  const baseWhite = new StandardMaterial("whitePiece", scene);
  baseWhite.diffuseColor = new Color3(0.95, 0.94, 0.9);
  baseWhite.specularColor = new Color3(0.2, 0.2, 0.2);

  const baseBlack = new StandardMaterial("blackPiece", scene);
  baseBlack.diffuseColor = new Color3(0.33, 0.24, 0.19);
  baseBlack.specularColor = new Color3(0.08, 0.08, 0.08);

  const ghostWhite = baseWhite.clone("ghostWhite");
  ghostWhite.alpha = 0.45;
  ghostWhite.backFaceCulling = false;
  const ghostBlack = baseBlack.clone("ghostBlack");
  ghostBlack.alpha = 0.45;
  ghostBlack.backFaceCulling = false;

  const applyOpaqueMaterial = (mesh, material) => {
    mesh.material = material;
    mesh.hasVertexAlpha = false;
  };

  const pieceTemplates = {};
  let previewWhiteMaterial = null;
  let previewBlackMaterial = null;

  const updatePreview = async (type, color) => {
    if (!previewCanvas || !previewScene || !previewCamera) return;
    const asset = pieceAssets[type];
    if (!asset) return;
    if (previewRoot) {
      previewRoot.dispose();
      previewRoot = null;
    }
    previewRoot = new TransformNode(`preview-${type}`, previewScene);
    if (previewNameEl) previewNameEl.textContent = pieceLabels[type] || type;

    let meshes = [];
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "/assets/",
        asset.file,
        previewScene,
      );
      meshes = result.meshes.filter(
        (m) => m.getTotalVertices && m.getTotalVertices() > 0,
      );
      meshes.forEach((m) => (m.parent = previewRoot));
      normalizeMeshes(
        `preview-${type}`,
        meshes,
        previewRoot,
        asset.height,
        previewScene,
      );
    } catch {
      const fallback = MeshBuilder.CreateCylinder(
        `preview-${type}-fallback`,
        { height: asset.height, diameterTop: 0.8, diameterBottom: 1 },
        previewScene,
      );
      meshes = [fallback];
      normalizeMeshes(
        `preview-${type}`,
        meshes,
        previewRoot,
        asset.height,
        previewScene,
      );
    }

    const material =
      color === "black" ? previewBlackMaterial : previewWhiteMaterial;
    if (material) meshes.forEach((m) => (m.material = material));

    const bounds = getBounds(previewRoot.getChildMeshes());
    const center = bounds.min.add(bounds.max).scale(0.5);
    const size = bounds.max.subtract(bounds.min);
    previewCamera.setTarget(center);
    previewCamera.radius = Math.max(3, Math.max(size.x, size.y, size.z) * 2.4);
  };

  const initPreview = () => {
    if (!previewCanvas) return;
    previewEngine = new Engine(previewCanvas, true);
    previewScene = new Scene(previewEngine);
    previewCamera = new ArcRotateCamera(
      "previewCamera",
      Math.PI / 2,
      Math.PI / 3,
      4,
      Vector3.Zero(),
      previewScene,
    );
    previewCamera.inputs.clear();

    const previewLight = new HemisphericLight(
      "previewLight",
      new Vector3(0, 1, 0),
      previewScene,
    );
    previewLight.intensity = 0.95;

    previewWhiteMaterial = new StandardMaterial("previewWhite", previewScene);
    previewWhiteMaterial.diffuseColor = new Color3(0.95, 0.94, 0.9);
    previewWhiteMaterial.specularColor = new Color3(0.2, 0.2, 0.2);

    previewBlackMaterial = new StandardMaterial("previewBlack", previewScene);
    previewBlackMaterial.diffuseColor = new Color3(0.33, 0.24, 0.19);
    previewBlackMaterial.specularColor = new Color3(0.08, 0.08, 0.08);

    previewScene.onBeforeRenderObservable.add(() => {
      if (previewRoot) previewRoot.rotation.y += 0.01;
    });
    previewEngine.runRenderLoop(() => previewScene.render());
  };

  const loadPieces = async () => {
    const library = buildPieceLibrary(scene, pieceTemplates);
    await library.loadAll();
  };

  // ── Player state ──────────────────────────────────────────────────────────
  const playerState = { gold: 10, hp: 100, level: 1 };

  // ── Shop tier system ──────────────────────────────────────────────────────
  const MAX_SHOP_TIER = 5;
  let shopTier = 1;

  /**
   * Upgrade cost starts at 5 gold on round 1 and decreases by 1 each round,
   * bottoming out at 2 gold (same formula as Hearthstone Battlegrounds).
   */
  const getUpgradeCost = () => Math.max(2, 6 - playerState.level);
  // ─────────────────────────────────────────────────────────────────────────

  const placedPieces = new Map();
  const budgets = {
    white: getPlayerTotalGold(playerState.level),
    black: getAIBudget(playerState.gold),
  };
  const counts = {
    white: Object.fromEntries(Object.keys(pieceDefs).map((k) => [k, 0])),
    black: Object.fromEntries(Object.keys(pieceDefs).map((k) => [k, 0])),
  };

  let currentShop = [null, null, null, null, null];

  // Generate a fresh shop from pieces available at the current tier
  const generateShopItems = () => {
    currentShop = [];
    const available = Object.keys(pieceDefs).filter(
      (p) => pieceDefs[p].tier <= shopTier,
    );
    for (let i = 0; i < 5; i++) {
      currentShop.push(available[Math.floor(Math.random() * available.length)]);
    }
    uiManager.clearShopSelection();
    uiManager.renderShop(currentShop, playerState, shopTier, getUpgradeCost());
  };

  // ── Upgrade shop ──────────────────────────────────────────────────────────
  const upgradeShop = () => {
    if (shopTier >= MAX_SHOP_TIER) return;
    const cost = getUpgradeCost();
    if (playerState.gold < cost) {
      uiManager.showToast("Not enough gold to upgrade the shop!");
      return;
    }
    playerState.gold -= cost;
    shopTier++;
    generateShopItems(); // regenerate with new tier; updates gold display too
    uiManager.showToast(
      `Shop upgraded to Tier ${shopTier}! Stronger pieces unlocked.`,
    );
  };
  uiManager.onUpgradeShop = upgradeShop;

  // ── Review playback ───────────────────────────────────────────────────────
  const exitReviewMode = () => {
    if (!isReviewing) return;
    isReviewing = false;

    placedPieces.forEach((entry, sq) => {
      if (!sq.startsWith("bench")) entry.root.setEnabled(false);
    });

    placedPieces.clear();
    savedNextRoundPieces.forEach((entry, sq) => {
      placedPieces.set(sq, entry);
      if (!sq.startsWith("bench")) entry.root.setEnabled(true);
    });

    currentPlyIndex = detailedHistory.length;
    uiManager.updatePlaybackUI(
      currentPlyIndex,
      detailedHistory.length,
      isReviewing,
    );
  };

  // ── Buy from shop ─────────────────────────────────────────────────────────
  const buyFromShop = (shopIndex) => {
    if (isReviewing) exitReviewMode();
    const type = currentShop[shopIndex];
    if (!type || !playerColor) return;

    const cost = pieceDefs[type].value;
    if (playerState.gold < cost) {
      console.warn("Not enough gold!");
      return;
    }

    let emptyBenchIndex = -1;
    for (let i = 0; i < 8; i++) {
      if (!placedPieces.has(`bench-${i}`)) {
        emptyBenchIndex = i;
        break;
      }
    }

    if (emptyBenchIndex !== -1) {
      playerState.gold -= cost;
      currentShop[shopIndex] = null;

      selectedPiece = `${playerColor}-${type}`;
      placePiece(`bench-${emptyBenchIndex}`);
      selectedPiece = null;

      uiManager.renderShop(
        currentShop,
        playerState,
        shopTier,
        getUpgradeCost(),
      );
    } else {
      console.warn("Bench is full!");
      uiManager.showToast("Your bench is full!");
    }
  };

  uiManager.onBuyPiece = buyFromShop;

  uiManager.onReroll = () => {
    if (isReviewing) exitReviewMode();
    if (playerState.gold >= 2) {
      playerState.gold -= 2;
      generateShopItems();
    } else {
      uiManager.showToast("Not enough gold to reroll!");
    }
  };

  const positionBenchTiles = (color) => {
    const benchZ = getBenchZPosForColor(color);
    benchTiles.forEach(
      (tile) => (tile.position.z = benchZ * tileSize - offset),
    );
  };

  let selectedPiece = null;
  let playerColor = null;
  let aiColor = null;

  // ── Piece helpers ─────────────────────────────────────────────────────────
  const removePiece = (squareId, isCombatDeath = false, softDelete = false) => {
    const existing = placedPieces.get(squareId);
    if (!existing) return null;

    if (softDelete) existing.root.setEnabled(false);
    else existing.root.dispose();

    placedPieces.delete(squareId);
    if (!isCombatDeath) {
      budgets[existing.color] += existing.value;
      counts[existing.color][existing.type] = Math.max(
        0,
        counts[existing.color][existing.type] - 1,
      );
    }
    return existing;
  };

  const getTileCoordinates = (squareId) => {
    if (squareId.startsWith("bench-")) {
      const col = parseInt(squareId.split("-")[1], 10);
      return {
        isBench: true,
        row: -1,
        col,
        zPos: getBenchZPosForColor(playerColor || "white"),
      };
    }
    const [row, col] = squareId.split("-").map(Number);
    return { isBench: false, row, col, zPos: row };
  };

  const isAllowedPlacement = (color, squareId) => {
    const coords = getTileCoordinates(squareId);
    if (coords.isBench) return color === playerColor;
    return color === "white" ? coords.row >= 4 : coords.row <= 3;
  };

  const placePiece = (squareId) => {
    if (!selectedPiece) return;
    const [color, type] = selectedPiece.split("-");
    const coords = getTileCoordinates(squareId);

    if (
      type === "pawn" &&
      !coords.isBench &&
      (coords.row === 0 || coords.row === 7)
    ) {
      console.warn("Pawns cannot be placed on the first or last ranks.");
      return;
    }

    const def = pieceDefs[type];
    if (!def) return;
    if (!isAllowedPlacement(color, squareId)) return;

    removePiece(squareId);

    const base = pieceTemplates[type];
    if (!base) return;

    const instanceRoot = base.clone(
      `${selectedPiece}-${squareId}`,
      null,
      false,
    );
    instanceRoot.setEnabled(true);
    instanceRoot.position.set(
      coords.col * tileSize - offset,
      pieceYOffset[type] || 0,
      coords.zPos * tileSize - offset,
    );
    const baseYaw = pieceYawFix[type] || 0;
    instanceRoot.rotation = new Vector3(
      0,
      baseYaw + (color === "black" ? Math.PI : 0),
      0,
    );

    instanceRoot.getChildMeshes().forEach((mesh) => {
      applyOpaqueMaterial(mesh, color === "white" ? baseWhite : baseBlack);
      mesh.metadata = { squareId, isPiece: true };
    });

    placedPieces.set(squareId, {
      root: instanceRoot,
      color,
      type,
      value: def.value,
    });

    if (color === aiColor) {
      budgets[color] -= def.value;
      counts[color][type] += 1;
    }

    playSound(sounds.move);
    updateAnalysisBar();
  };

  const movePiece = (fromSq, toSq) => {
    if (fromSq === toSq) return;
    const entry = placedPieces.get(fromSq);
    if (!entry || placedPieces.has(toSq)) return;

    const toCoords = getTileCoordinates(toSq);
    if (!isAllowedPlacement(entry.color, toSq)) return;
    if (
      entry.type === "pawn" &&
      !toCoords.isBench &&
      (toCoords.row === 0 || toCoords.row === 7)
    )
      return;

    entry.root.position.set(
      toCoords.col * tileSize - offset,
      pieceYOffset[entry.type] || 0,
      toCoords.zPos * tileSize - offset,
    );
    entry.root.getChildMeshes().forEach((m) => {
      if (m.metadata) m.metadata.squareId = toSq;
    });

    placedPieces.delete(fromSq);
    placedPieces.set(toSq, entry);
    playSound(sounds.move);
    updateAnalysisBar();
  };

  const moveColorToBench = (color) => {
    let benchFull = false;
    placedPieces.forEach((entry, squareId) => {
      if (entry.color === color && !squareId.startsWith("bench")) {
        let emptyBenchIndex = -1;
        for (let i = 0; i < 8; i++) {
          if (!placedPieces.has(`bench-${i}`)) {
            emptyBenchIndex = i;
            break;
          }
        }
        if (emptyBenchIndex !== -1)
          movePiece(squareId, `bench-${emptyBenchIndex}`);
        else benchFull = true;
      }
    });
    if (benchFull)
      uiManager.showToast("Bench is full! Some pieces remained on board.");
  };

  const clearColor = (color) => {
    placedPieces.forEach((entry, squareId) => {
      if (entry.color === color) removePiece(squareId);
    });
  };

  const setAnalysisVisible = (visible) =>
    analysisBarEl?.classList.toggle("hidden", !visible);

  const updateAnalysisBar = () => {
    if (!analysisFillEl) return;
    let ratio = 0.5;
    if (lastEvalScore) {
      const { type, value } = lastEvalScore;
      if (type === "mate") ratio = value >= 0 ? 0.98 : 0.02;
      else ratio = (Math.min(1000, Math.max(-1000, value)) + 1000) / 2000;
    } else {
      let w = 0,
        b = 0;
      placedPieces.forEach((entry, sq) => {
        if (!sq.startsWith("bench")) {
          if (entry.color === "white") w += entry.value;
          else b += entry.value;
        }
      });
      const total = w + b;
      if (total > 0) ratio = w / total;
    }
    analysisFillEl.style.height = `${Math.round(Math.min(0.98, Math.max(0.02, ratio)) * 100)}%`;
  };

  // ── AI placement – respects current shopTier ──────────────────────────────
  const randomizeAI = () => {
    if (!aiColor) return;
    clearColor(aiColor);

    const squares = tiles
      .map((t) => t.metadata.squareId)
      .filter((sq) => isAllowedPlacement(aiColor, sq));

    // Shuffle
    for (let i = squares.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [squares[i], squares[j]] = [squares[j], squares[i]];
    }

    squares.forEach((squareId) => {
      const affordable = Object.entries(pieceDefs).filter(([type, def]) => {
        if (def.tier > shopTier) return false; // ← tier gate
        const coords = getTileCoordinates(squareId);
        if (
          type === "pawn" &&
          !coords.isBench &&
          (coords.row === 0 || coords.row === 7)
        )
          return false;
        return counts[aiColor][type] < def.max && budgets[aiColor] >= def.value;
      });
      if (!affordable.length) return;

      const [type] = affordable[Math.floor(Math.random() * affordable.length)];
      selectedPiece = `${aiColor}-${type}`;
      placePiece(squareId);
    });

    selectedPiece = null;
    uiManager.clearSelection();
  };

  const setSide = (color) => {
    playerColor = color;
    aiColor = color === "white" ? "black" : "white";
    uiManager.setPlayerColor(playerColor);
    uiManager.setSidePickerVisible(false);
    selectedPiece = null;
    uiManager.clearSelection();
    positionBenchTiles(playerColor);

    placedPieces.forEach((e) => e.root.dispose());
    placedPieces.clear();

    budgets.white = getPlayerTotalGold(playerState.level);
    budgets.black = getAIBudget(playerState.gold);
    Object.keys(counts.white).forEach((k) => {
      counts.white[k] = 0;
      counts.black[k] = 0;
    });

    uiManager.renderShop(currentShop, playerState, shopTier, getUpgradeCost());
    randomizeAI();
  };

  // ── Battle engine ─────────────────────────────────────────────────────────
  let gameInProgress = false;
  let currentTurn = "white";
  let initialFen = "";
  let moveHistory = [];
  let desyncRetries = 0;
  const MAX_DESYNC_RETRIES = 2;
  let noMoveCount = 0;
  let moveStartTime = 0;

  const engineClient = new EngineClient(
    new URL("/engine/chess-worker.js", window.location.origin),
  );
  let lastEvalScore = null;

  const fromAlgebraic = (sq) => ({
    col: sq.charCodeAt(0) - 97,
    row: 8 - parseInt(sq[1]),
  });

  const executeEngineMove = (move) => {
    console.log("Executing move:", move, "Turn:", currentTurn);
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const fromCoord = fromAlgebraic(from);
    const toCoord = fromAlgebraic(to);
    const fromSq = `${fromCoord.row}-${fromCoord.col}`;
    const toSq = `${toCoord.row}-${toCoord.col}`;
    const piece = placedPieces.get(fromSq);

    if (!piece) {
      console.error("Move FAILED – no piece at", fromSq);
      if (gameInProgress && desyncRetries < MAX_DESYNC_RETRIES) {
        desyncRetries++;
        initialFen = generateFEN(placedPieces, currentTurn);
        moveHistory = [];
        requestEngineMove();
        return;
      }
      resolveAnnihilation();
      return;
    }

    const historyRecord = {
      move,
      fromSq,
      toSq,
      pieceMoved: piece,
      capturedPiece: null,
      enPassantSq: null,
      promotionInfo: null,
    };
    let capturedPiece = false;

    // En passant
    if (
      piece.type === "pawn" &&
      fromCoord.col !== toCoord.col &&
      !placedPieces.has(toSq)
    ) {
      const epSq = `${fromCoord.row}-${toCoord.col}`;
      if (placedPieces.has(epSq)) {
        historyRecord.enPassantSq = epSq;
        historyRecord.capturedPiece = removePiece(epSq, true, true);
        capturedPiece = true;
      }
    }

    if (placedPieces.has(toSq)) {
      historyRecord.capturedPiece = removePiece(toSq, true, true);
      capturedPiece = true;
    }

    noMoveCount = piece.type === "pawn" || capturedPiece ? 0 : noMoveCount + 1;

    piece.root.position.x = toCoord.col * tileSize - offset;
    piece.root.position.z = toCoord.row * tileSize - offset;
    piece.root.getChildMeshes().forEach((m) => {
      if (m.metadata) m.metadata.squareId = toSq;
    });
    placedPieces.delete(fromSq);
    placedPieces.set(toSq, piece);

    // Promotion
    const isPromotion = move.length > 4;
    if (isPromotion) {
      const promoMap = {
        q: "queen",
        r: "rook",
        b: "bishop",
        n: "knight",
        a: "archbishop",
        h: "chancellor",
        c: "camel",
        w: "wizzard",
        z: "amazon",
        i: "immobilizer",
        f: "fool",
        m: "mammoth",
        v: "vizier", // ← NEW
      };
      const newType = promoMap[move[4].toLowerCase()] || "queen";

      historyRecord.promotionInfo = {
        oldType: piece.type,
        oldValue: piece.value,
        oldRoot: piece.root,
        newRoot: null,
      };

      piece.type = newType;
      piece.value = pieceDefs[newType].value;

      const oldRoot = piece.root;
      const base = pieceTemplates[newType];
      if (base) {
        const newRoot = base.clone(
          `${piece.color}-${newType}-${toSq}`,
          null,
          false,
        );
        newRoot.setEnabled(true);
        newRoot.position.x = oldRoot.position.x;
        newRoot.position.z = oldRoot.position.z;
        newRoot.position.y = pieceYOffset[newType] || 0;
        const baseYaw = pieceYawFix[newType] || 0;
        newRoot.rotation = new Vector3(
          0,
          baseYaw + (piece.color === "black" ? Math.PI : 0),
          0,
        );
        newRoot.getChildMeshes().forEach((m) => {
          applyOpaqueMaterial(
            m,
            piece.color === "white" ? baseWhite : baseBlack,
          );
          m.metadata = { squareId: toSq, isPiece: true };
        });
        oldRoot.setEnabled(false);
        piece.root = newRoot;
        historyRecord.promotionInfo.newRoot = newRoot;
      }
    }

    playSound(
      isPromotion
        ? sounds.promote
        : capturedPiece
          ? sounds.capture
          : sounds.move,
    );
    updateAnalysisBar();

    moveHistory.push(move);
    detailedHistory.push(historyRecord);
    currentPlyIndex = detailedHistory.length;
    uiManager.updatePlaybackUI(
      currentPlyIndex,
      detailedHistory.length,
      isReviewing,
    );
    desyncRetries = 0;

    currentTurn = currentTurn === "white" ? "black" : "white";
    updateTimerVisuals(currentTurn);

    if (noMoveCount >= 20) {
      uiManager.showToast(
        "Battle stagnated! Resolving based on surviving material...",
      );
      resolveAnnihilation();
      return;
    }

    checkFinalWinner();
    if (gameInProgress) requestEngineMove();
  };

  // ── Playback ──────────────────────────────────────────────────────────────
  const undoMove = () => {
    if (gameInProgress) {
      uiManager.showToast("Wait for the round to end to review moves!");
      return;
    }
    if (currentPlyIndex <= 0) return;

    if (!isReviewing) {
      savedNextRoundPieces = new Map(placedPieces);
      placedPieces.forEach((e, sq) => {
        if (!sq.startsWith("bench")) e.root.setEnabled(false);
      });
      placedPieces.clear();
      battleEndPlacedPieces.forEach((e, sq) => {
        placedPieces.set(sq, e);
        if (!sq.startsWith("bench")) e.root.setEnabled(true);
      });
    }

    const {
      fromSq,
      toSq,
      pieceMoved,
      capturedPiece,
      enPassantSq,
      promotionInfo,
    } = detailedHistory[currentPlyIndex - 1];
    const fromCoord = fromAlgebraic(
      detailedHistory[currentPlyIndex - 1].move.substring(0, 2),
    );

    pieceMoved.root.setEnabled(true);
    pieceMoved.root.position.x = fromCoord.col * tileSize - offset;
    pieceMoved.root.position.z = fromCoord.row * tileSize - offset;
    pieceMoved.root.getChildMeshes().forEach((m) => {
      if (m.metadata) m.metadata.squareId = fromSq;
    });
    placedPieces.delete(toSq);
    placedPieces.set(fromSq, pieceMoved);

    if (promotionInfo) {
      promotionInfo.newRoot.setEnabled(false);
      promotionInfo.oldRoot.setEnabled(true);
      pieceMoved.root = promotionInfo.oldRoot;
      pieceMoved.type = promotionInfo.oldType;
      pieceMoved.value = promotionInfo.oldValue;
    }
    if (capturedPiece) {
      const restoreSq = enPassantSq || toSq;
      capturedPiece.root.setEnabled(true);
      placedPieces.set(restoreSq, capturedPiece);
    }

    currentPlyIndex--;
    isReviewing = true;
    uiManager.updatePlaybackUI(
      currentPlyIndex,
      detailedHistory.length,
      isReviewing,
    );
    playSound(sounds.move);
  };

  const redoMove = () => {
    if (gameInProgress) {
      uiManager.showToast("Wait for the round to end to review moves!");
      return;
    }
    if (currentPlyIndex >= detailedHistory.length) return;

    if (!isReviewing) {
      savedNextRoundPieces = new Map(placedPieces);
      placedPieces.forEach((e, sq) => {
        if (!sq.startsWith("bench")) e.root.setEnabled(false);
      });
      placedPieces.clear();
      battleEndPlacedPieces.forEach((e, sq) => {
        placedPieces.set(sq, e);
        if (!sq.startsWith("bench")) e.root.setEnabled(true);
      });
    }

    const {
      fromSq,
      toSq,
      pieceMoved,
      capturedPiece,
      enPassantSq,
      promotionInfo,
    } = detailedHistory[currentPlyIndex];
    const toCoord = fromAlgebraic(
      detailedHistory[currentPlyIndex].move.substring(2, 4),
    );

    if (capturedPiece) {
      placedPieces.delete(enPassantSq || toSq);
      capturedPiece.root.setEnabled(false);
    }
    if (promotionInfo) {
      promotionInfo.oldRoot.setEnabled(false);
      promotionInfo.newRoot.setEnabled(true);
      pieceMoved.root = promotionInfo.newRoot;
      const promoType = promotionInfo.newRoot.name.split("-")[1];
      pieceMoved.type = promoType;
      pieceMoved.value = pieceDefs[promoType]?.value || 9;
    }

    pieceMoved.root.setEnabled(true);
    pieceMoved.root.position.x = toCoord.col * tileSize - offset;
    pieceMoved.root.position.z = toCoord.row * tileSize - offset;
    pieceMoved.root.getChildMeshes().forEach((m) => {
      if (m.metadata) m.metadata.squareId = toSq;
    });
    placedPieces.delete(fromSq);
    placedPieces.set(toSq, pieceMoved);

    currentPlyIndex++;
    isReviewing = true;
    uiManager.updatePlaybackUI(
      currentPlyIndex,
      detailedHistory.length,
      isReviewing,
    );
    playSound(sounds.move);
  };

  const goToFirstMove = () => {
    if (!gameInProgress && detailedHistory.length > 0)
      while (currentPlyIndex > 0) undoMove();
  };
  const goToLastMove = () => {
    if (!gameInProgress && detailedHistory.length > 0)
      while (currentPlyIndex < detailedHistory.length) redoMove();
  };

  // ── Combat end ────────────────────────────────────────────────────────────
  let preCombatPlayerState = [];

  const endCombat = (playerWon, damageTaken, timeout = false) => {
    gameInProgress = false;
    if (timerInterval) clearInterval(timerInterval);
    timerContainer.style.display = "none";
    uiManager.setStartBattleState({ inProgress: false });
    setAnalysisVisible(false);

    let dialogTitle = "",
      dialogText = "",
      onCloseCallback = null;

    if (timeout) {
      if (!playerWon) {
        playerState.hp -= damageTaken;
        if (playerState.hp <= 0) {
          dialogTitle = "Game Over";
          dialogText = `Time's up! You survived to Round ${playerState.level}.`;
          onCloseCallback = () => location.reload();
        } else {
          dialogTitle = "Round Lost";
          dialogText = `Time's up! Took ${damageTaken} damage.`;
        }
      } else {
        dialogTitle = "Round Won";
        dialogText = "Time's up! Black lost on time. You won the round!";
      }
    } else if (!playerWon && damageTaken > 0) {
      playerState.hp -= damageTaken;
      if (playerState.hp <= 0) {
        dialogTitle = "Game Over";
        dialogText = `Your HP dropped to 0! You survived to Round ${playerState.level}.`;
        onCloseCallback = () => location.reload();
      } else {
        dialogTitle = "Round Lost";
        dialogText = `You lost round ${playerState.level}! Took ${damageTaken} damage.`;
      }
    } else if (playerWon) {
      dialogTitle = "Victory!";
      dialogText = `You won round ${playerState.level}!`;
    } else {
      dialogTitle = "Draw";
      dialogText = "Round ended in a draw!";
    }

    uiManager.showDialog(dialogTitle, dialogText, onCloseCallback);

    // Advance round
    playerState.level += 1;
    playerState.gold += 5;

    // Snapshot board for playback
    battleEndPlacedPieces = new Map(placedPieces);

    // Clear combat pieces (keep player bench)
    const toRemove = [];
    placedPieces.forEach((entry, sq) => {
      const isPlayerBench =
        sq.startsWith("bench") && entry.color === playerColor;
      if (!isPlayerBench) toRemove.push(sq);
    });
    toRemove.forEach((sq) => {
      const piece = placedPieces.get(sq);
      if (piece?.root) piece.root.setEnabled(false);
      placedPieces.delete(sq);
    });

    // Restore player's pre-combat formation
    preCombatPlayerState.forEach((saved) => {
      selectedPiece = `${playerColor}-${saved.type}`;
      placePiece(saved.squareId);
    });
    selectedPiece = null;

    // Refresh shop (new round, lower upgrade cost)
    generateShopItems();

    // Refresh AI
    budgets.black = getAIBudget(playerState.gold);
    Object.keys(counts.black).forEach((k) => (counts.black[k] = 0));
    randomizeAI();
  };

  const checkFinalWinner = () => {
    let w = false,
      b = false;
    placedPieces.forEach((p, sq) => {
      if (!sq.startsWith("bench")) {
        if (p.color === "white") w = true;
        if (p.color === "black") b = true;
      }
    });
    if (!w && !b) endCombat(false, 0);
    else if (!w) {
      let bv = 0;
      placedPieces.forEach((p, sq) => {
        if (p.color === "black" && !sq.startsWith("bench")) bv += p.value;
      });
      endCombat(false, bv);
    } else if (!b) endCombat(true, 0);
  };

  const resolveAnnihilation = () => {
    let wv = 0,
      bv = 0;
    placedPieces.forEach((e, sq) => {
      if (!sq.startsWith("bench")) {
        if (e.color === "white") wv += e.value;
        else bv += e.value;
      }
    });
    if (wv === 0 && bv === 0) endCombat(false, 0);
    else if (wv === 0) endCombat(false, bv);
    else if (bv === 0) endCombat(true, 0);
    else if (wv >= bv) endCombat(true, 0);
    else endCombat(false, bv - wv);
  };

  // ── Engine ────────────────────────────────────────────────────────────────
  const requestEngineMove = () => {
    if (!gameInProgress) return;
    moveStartTime = Date.now();
    const historyStr =
      moveHistory.length > 0 ? " moves " + moveHistory.join(" ") : "";
    engineClient.requestMove(
      `position fen ${initialFen}${historyStr}`,
      "go movetime 3900",
    );
  };

  const initEngine = () => {
    engineClient.onLine = (line) => {
      if (line.includes("score ")) {
        const match = line.match(/score (cp|mate) (-?\d+)/);
        if (match) {
          let value = Number(match[2]);
          if (currentTurn === "black") value *= -1;
          lastEvalScore = { type: match[1], value };
          updateAnalysisBar();
        }
      }
    };
    engineClient.onBestMove = (move) => {
      const elapsed = Date.now() - moveStartTime;
      const delay = Math.max(0, 4000 - elapsed);

      if (move && move !== "(none)" && move !== "null") {
        setTimeout(() => executeEngineMove(move), delay);
        return;
      }
      setTimeout(() => resolveAnnihilation(), delay);
    };
    engineClient.startBattle(() => {
      if (gameInProgress) requestEngineMove();
    });
  };

  // ── Start battle ──────────────────────────────────────────────────────────
  uiManager.onStartBattle = () => {
    if (isReviewing) exitReviewMode();
    if (gameInProgress) return;

    let hasBoardPieces = false;
    placedPieces.forEach((p, sq) => {
      if (p.color === "white" && !sq.startsWith("bench")) hasBoardPieces = true;
    });
    if (!hasBoardPieces) {
      uiManager.showToast("Place at least one piece on the board to fight!");
      return;
    }

    unlockAudio();
    gameInProgress = true;
    desyncRetries = 0;
    noMoveCount = 0;
    lastEvalScore = null;

    detailedHistory = [];
    currentPlyIndex = 0;
    isReviewing = false;
    uiManager.setPlaybackVisible(true);
    uiManager.updatePlaybackUI(0, 0, false);
    setAnalysisVisible(true);
    updateAnalysisBar();
    uiManager.setStartBattleState({ inProgress: true });
    currentTurn = "white";

    // Snapshot pre-combat player formation
    preCombatPlayerState = [];
    placedPieces.forEach((entry, squareId) => {
      if (entry.color === playerColor && !squareId.startsWith("bench")) {
        preCombatPlayerState.push({ squareId, type: entry.type });
      }
    });

    initialFen = generateFEN(placedPieces, "white");
    moveHistory = [];

    // Timers
    timeWhite = 180;
    timeBlack = 180;
    whiteTimerEl.innerText = "03:00";
    blackTimerEl.innerText = "03:00";
    timerContainer.style.display = "flex";
    updateTimerVisuals(currentTurn);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!gameInProgress) return;
      if (currentTurn === "white") timeWhite--;
      else timeBlack--;

      const fmt = (t) => {
        const m = Math.floor(t / 60)
          .toString()
          .padStart(2, "0");
        const s = (t % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
      };
      whiteTimerEl.innerText = fmt(Math.max(0, timeWhite));
      blackTimerEl.innerText = fmt(Math.max(0, timeBlack));

      if (timeWhite <= 0) {
        clearInterval(timerInterval);
        endCombat(false, 15, true);
      } else if (timeBlack <= 0) {
        clearInterval(timerInterval);
        endCombat(true, 0, true);
      }
    }, 1000);

    initEngine();
  };

  // ── Playback wiring ───────────────────────────────────────────────────────
  uiManager.onPrevTurn = undoMove;
  uiManager.onNextTurn = redoMove;
  uiManager.onExitReview = exitReviewMode;

  document.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key))
      e.preventDefault();
    if (!gameInProgress && detailedHistory.length === 0) return;
    if (e.key === "ArrowLeft") undoMove();
    if (e.key === "ArrowRight") redoMove();
    if (e.key === "ArrowUp") goToFirstMove();
    if (e.key === "ArrowDown") goToLastMove();
  });

  // ── Other UI callbacks ────────────────────────────────────────────────────
  uiManager.onPickSide = (color) => setSide(color);
  uiManager.onClearBoard = () => {
    if (isReviewing) exitReviewMode();
    if (playerColor) moveColorToBench(playerColor);
  };
  uiManager.onPieceSelected = (pieceId) => {
    selectedPiece = pieceId;
    if (pieceId) {
      const [color, type] = pieceId.split("-");
      updatePreview(type, color);
    }
  };

  // ── Pointer / drag ────────────────────────────────────────────────────────
  scene.onPointerObservable.add((pointerInfo) => {
    if (gameInProgress) return;

    const isDown = pointerInfo.type === PointerEventTypes.POINTERDOWN;
    const isUp = pointerInfo.type === PointerEventTypes.POINTERUP;
    const isMove = pointerInfo.type === PointerEventTypes.POINTERMOVE;
    if (!isDown && !isUp && !isMove) return;

    if (isDown && isReviewing) exitReviewMode();

    if (!scene.metadata) scene.metadata = {};
    if (!scene.metadata.dragState) {
      scene.metadata.dragState = {
        active: false,
        fromSq: null,
        entry: null,
        ghost: null,
        sellValue: 0,
      };
    }
    const dragState = scene.metadata.dragState;

    // Right-click → move info
    if (isDown && pointerInfo.event?.button === 2) {
      const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (m) => !!m.metadata?.isPiece,
      );
      if (pick?.hit && pick.pickedMesh?.metadata?.squareId) {
        const entry = placedPieces.get(pick.pickedMesh.metadata.squareId);
        if (entry) {
          uiManager.showMoveModal(
            `${pieceLabels[entry.type] || entry.type} (Cost: ${gemIcon} ${entry.value})`,
            pieceMoves[entry.type] || "No movement info available.",
          );
        }
      }
      return;
    }

    // Drag start
    if (isDown) {
      const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (m) => !!m.metadata?.isPiece,
      );
      if (pick?.hit && pick.pickedMesh?.metadata?.squareId) {
        const squareId = pick.pickedMesh.metadata.squareId;
        const entry = placedPieces.get(squareId);
        if (entry && entry.color === playerColor) {
          const ghost = entry.root.clone(
            `${entry.color}-${entry.type}-${squareId}-ghost`,
            null,
            false,
          );
          ghost.setEnabled(true);
          ghost.position.copyFrom(entry.root.position);
          ghost.rotation.copyFrom(entry.root.rotation);
          ghost.getChildMeshes().forEach((m) => {
            m.material = entry.color === "white" ? ghostWhite : ghostBlack;
            m.isPickable = false;
          });
          dragState.active = true;
          dragState.fromSq = squareId;
          dragState.entry = entry;
          dragState.ghost = ghost;
          dragState.sellValue = Math.max(1, Math.floor(entry.value * 0.7));
          uiManager.showSellZone(dragState.sellValue);
          camera.detachControl();
          return;
        }
      }
    }

    // Drag move
    if (isMove && dragState.active) {
      const px = pointerInfo.event?.clientX ?? 0;
      const py = pointerInfo.event?.clientY ?? 0;
      uiManager.highlightSellZone(uiManager.isPointerOverSellZone(px, py));

      const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (m) => !!m.metadata?.squareId && !m.metadata?.isPiece,
      );
      if (!pick?.hit || !pick.pickedMesh?.metadata?.squareId) return;
      const squareId = pick.pickedMesh.metadata.squareId;
      if (!isAllowedPlacement(dragState.entry.color, squareId)) return;

      const coords = getTileCoordinates(squareId);
      dragState.ghost.position.set(
        coords.col * tileSize - offset,
        pieceYOffset[dragState.entry.type] || 0,
        coords.zPos * tileSize - offset,
      );
      dragState.toSq = squareId;
      return;
    }

    // Drag end / drop
    if (isUp && dragState.active) {
      const px = pointerInfo.event?.clientX ?? 0;
      const py = pointerInfo.event?.clientY ?? 0;

      if (uiManager.isPointerOverSellZone(px, py)) {
        playerState.gold += dragState.sellValue;
        removePiece(dragState.fromSq);
        uiManager.renderShop(
          currentShop,
          playerState,
          shopTier,
          getUpgradeCost(),
        );
        playSound(sounds.capture);
      } else {
        const targetSq = dragState.toSq || dragState.fromSq;
        if (
          targetSq &&
          targetSq !== dragState.fromSq &&
          !placedPieces.has(targetSq)
        ) {
          movePiece(dragState.fromSq, targetSq);
        }
      }

      if (dragState.ghost) dragState.ghost.dispose();
      uiManager.hideSellZone();
      camera.attachControl(canvas, true);
      Object.assign(dragState, {
        active: false,
        fromSq: null,
        toSq: null,
        entry: null,
        ghost: null,
        sellValue: 0,
      });
      return;
    }
  });

  // ── Boot ──────────────────────────────────────────────────────────────────
  await loadPieces();
  initPreview();
  generateShopItems();
  return scene;
};

const scene = await createScene();
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => {
  engine.resize();
  if (previewEngine) previewEngine.resize();
});
