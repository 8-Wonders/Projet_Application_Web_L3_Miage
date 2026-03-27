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

// --- 3+0 Timer UI Setup ---
const timerContainer = document.createElement("div");
timerContainer.id = "chess-timers";
timerContainer.style.position = "absolute";
timerContainer.style.top = "15px";
timerContainer.style.right = "15px";
timerContainer.style.display = "none";
timerContainer.style.flexDirection = "column";
timerContainer.style.gap = "8px";
timerContainer.style.zIndex = "1000";
timerContainer.style.fontFamily = "monospace";
timerContainer.style.fontSize = "24px";
timerContainer.style.fontWeight = "bold";
timerContainer.style.pointerEvents = "none";

const blackTimerEl = document.createElement("div");
blackTimerEl.style.backgroundColor = "rgba(30, 30, 30, 0.85)";
blackTimerEl.style.color = "white";
blackTimerEl.style.padding = "8px 16px";
blackTimerEl.style.borderRadius = "6px";
blackTimerEl.style.border = "3px solid transparent";
blackTimerEl.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";
blackTimerEl.innerText = "03:00";

const whiteTimerEl = document.createElement("div");
whiteTimerEl.style.backgroundColor = "rgba(240, 240, 240, 0.85)";
whiteTimerEl.style.color = "black";
whiteTimerEl.style.padding = "8px 16px";
whiteTimerEl.style.borderRadius = "6px";
whiteTimerEl.style.border = "3px solid transparent";
whiteTimerEl.style.boxShadow = "0 4px 6px rgba(0,0,0,0.3)";
whiteTimerEl.innerText = "03:00";

timerContainer.appendChild(blackTimerEl);
timerContainer.appendChild(whiteTimerEl);
document.body.appendChild(timerContainer);

let timeWhite = 180;
let timeBlack = 180;
let timerInterval = null;

const updateTimerVisuals = (turn) => {
  if (turn === "white") {
    whiteTimerEl.style.borderColor = "#4ade80";
    blackTimerEl.style.borderColor = "transparent";
  } else {
    blackTimerEl.style.borderColor = "#4ade80";
    whiteTimerEl.style.borderColor = "transparent";
  }
};
// --------------------------

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

// Prevent browser zoom gestures while interacting with the scene.
window.addEventListener(
  "wheel",
  (event) => {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  },
  { passive: false },
);
["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
  window.addEventListener(
    type,
    (event) => {
      event.preventDefault();
    },
    { passive: false },
  );
});

const createScene = async () => {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    "camera",
    Math.PI / 4,
    Math.PI / 3,
    18,
    new Vector3(0, 0, 0),
    scene,
  );
  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = 0.3;
  camera.upperBetaLimit = 1.2;
  camera.wheelDeltaPercentage = 0.01;

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
    if (!sound) {
      return;
    }
    if (sound.isPlaying) {
      sound.stop();
    }
    sound.play();
  };

  const unlockAudio = () => {
    const audioEngine = Engine.audioEngine || engine.getAudioEngine?.();
    if (audioEngine && !audioEngine.unlocked) {
      audioEngine.unlock();
    }
  };

  canvas.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("pointerdown", unlockAudio, { once: true });
  document.addEventListener("keydown", unlockAudio, { once: true });

  // Dynamic budget scaling
  const getPlayerTotalGold = (level) => 10 + (level - 1) * 5;
  const getAIBudget = (playerGold) => playerGold + 2;

  const boardRoot = new TransformNode("boardRoot", scene);

  const lightTile = new StandardMaterial("lightTile", scene);
  lightTile.diffuseColor = new Color3(0.91, 0.87, 0.8);

  const darkTile = new StandardMaterial("darkTile", scene);
  darkTile.diffuseColor = new Color3(0.33, 0.24, 0.19);

  const tileSize = 1.8;
  const offset = (7 * tileSize) / 2;

  const tiles = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const tile = MeshBuilder.CreateBox(
        `tile-${row}-${col}`,
        { width: tileSize, depth: tileSize, height: 0.2 },
        scene,
      );
      tile.position.x = col * tileSize - offset;
      tile.position.z = row * tileSize - offset;
      tile.position.y = -0.1;
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
  for (let col = 0; col < 8; col += 1) {
    const tile = MeshBuilder.CreateBox(
      `bench-tile-${col}`,
      { width: tileSize, depth: tileSize, height: 0.15 },
      scene,
    );

    // Align with the columns of the board
    tile.position.x = col * tileSize - offset;

    // Default bench position (White's side) until a side is picked
    tile.position.z = getBenchZPosForColor("white") * tileSize - offset;
    tile.position.y = -0.1;

    tile.material = benchMaterial;
    tile.metadata = { squareId: `bench-${col}`, isBench: true };
    tile.isPickable = true;
    tile.parent = boardRoot;
    benchTiles.push(tile);
  }

  const baseWhite = new StandardMaterial("whitePiece", scene);
  baseWhite.diffuseColor = new Color3(0.95, 0.94, 0.9);
  baseWhite.specularColor = new Color3(0.2, 0.2, 0.2);
  baseWhite.alpha = 1;
  baseWhite.useVertexAlpha = false;

  const baseBlack = new StandardMaterial("blackPiece", scene);
  baseBlack.diffuseColor = new Color3(0.33, 0.24, 0.19);
  baseBlack.specularColor = new Color3(0.08, 0.08, 0.08);
  baseBlack.alpha = 1;
  baseBlack.useVertexAlpha = false;

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
    if (!previewCanvas || !previewScene || !previewCamera) {
      return;
    }
    const asset = pieceAssets[type];
    if (!asset) {
      return;
    }
    if (previewRoot) {
      previewRoot.dispose();
      previewRoot = null;
    }
    previewRoot = new TransformNode(`preview-${type}`, previewScene);
    if (previewNameEl) {
      previewNameEl.textContent = pieceLabels[type] || type;
    }

    let meshes = [];
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "/assets/",
        asset.file,
        previewScene,
      );
      meshes = result.meshes.filter(
        (mesh) => mesh.getTotalVertices && mesh.getTotalVertices() > 0,
      );
      meshes.forEach((mesh) => {
        mesh.parent = previewRoot;
      });
      normalizeMeshes(
        `preview-${type}`,
        meshes,
        previewRoot,
        asset.height,
        previewScene,
      );
    } catch (e) {
      const fallback = MeshBuilder.CreateCylinder(
        `preview-${type}-fallback`,
        {
          height: asset.height,
          diameterTop: 0.8,
          diameterBottom: 1,
        },
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
    if (material) {
      meshes.forEach((mesh) => {
        mesh.material = material;
      });
    }

    const bounds = getBounds(previewRoot.getChildMeshes());
    const center = bounds.min.add(bounds.max).scale(0.5);
    const size = bounds.max.subtract(bounds.min);
    const maxDim = Math.max(size.x, size.y, size.z);
    previewCamera.setTarget(center);
    previewCamera.radius = Math.max(3, maxDim * 2.4);
  };

  const initPreview = () => {
    if (!previewCanvas) {
      return;
    }
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
    previewCamera.attachControl(previewCanvas, false);
    previewCamera.inputs.clear();
    previewCamera.lowerRadiusLimit = 3;
    previewCamera.upperRadiusLimit = 6;

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
      if (previewRoot) {
        previewRoot.rotation.y += 0.01;
      }
    });

    previewEngine.runRenderLoop(() => {
      previewScene.render();
    });
  };

  const loadPieces = async () => {
    const library = buildPieceLibrary(scene, pieceTemplates);
    await library.loadAll();
  };

  const playerState = {
    gold: 10,
    hp: 100,
    level: 1,
  };

  const placedPieces = new Map();
  const budgets = { white: getPlayerTotalGold(playerState.level), black: getAIBudget(playerState.gold) };
  
  const counts = {
    white: Object.fromEntries(Object.keys(pieceDefs).map((key) => [key, 0])),
    black: Object.fromEntries(Object.keys(pieceDefs).map((key) => [key, 0])),
  };

  let currentShop = [null, null, null, null, null];

  const generateShopItems = () => {
    currentShop = [];
    const pieceTypes = Object.keys(pieceDefs).filter((p) => p !== "fool");

    for (let i = 0; i < 5; i++) {
      const randomType =
        pieceTypes[Math.floor(Math.random() * pieceTypes.length)];
      currentShop.push(randomType);
    }

    uiManager.clearShopSelection();
    uiManager.renderShop(currentShop, playerState);
  };

  const buyFromShop = (shopIndex) => {
    const type = currentShop[shopIndex];
    if (!type) return;
    if (!playerColor) return;

    const cost = pieceDefs[type].value;

    if (playerState.gold >= cost) {
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

        uiManager.renderShop(currentShop, playerState);
      } else {
        console.warn("Your bench is full!");
      }
    } else {
      console.warn("Not enough gold!");
    }
  };

  uiManager.onBuyPiece = buyFromShop;

  uiManager.onReroll = () => {
    if (playerState.gold >= 2) {
      playerState.gold -= 2;
      generateShopItems();
    } else {
      console.warn("Not enough gold to reroll!");
    }
  };

  const positionBenchTiles = (color) => {
    const benchZ = getBenchZPosForColor(color);
    benchTiles.forEach((tile) => {
      tile.position.z = benchZ * tileSize - offset;
    });
  };

  let selectedPiece = null;
  let playerColor = null;
  let aiColor = null;

  const updateUI = () => {
    uiManager.setPieceVisibility(playerColor, aiColor);
    uiManager.setBudgets(budgets, playerColor);
    uiManager.updateAvailability(budgets, counts, playerColor);
  };

  const removePiece = (squareId, isCombatDeath = false) => {
    const existing = placedPieces.get(squareId);
    if (!existing) {
      return;
    }
    existing.root.dispose();
    placedPieces.delete(squareId);

    if (!isCombatDeath) {
      budgets[existing.color] += existing.value;
      counts[existing.color][existing.type] = Math.max(
        0,
        counts[existing.color][existing.type] - 1,
      );
    }
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
    if (coords.isBench) {
      return color === playerColor;
    }
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
    console.log(`Placed piece: ${selectedPiece} at ${squareId}`);

    instanceRoot.setEnabled(true);
    instanceRoot.position.x = coords.col * tileSize - offset;
    instanceRoot.position.z = coords.zPos * tileSize - offset;
    instanceRoot.position.y = pieceYOffset[type] || 0;

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

    updateUI();
    playSound(sounds.move);
    updateAnalysisBar();
  };

  const movePiece = (fromSq, toSq) => {
    if (fromSq === toSq) return;

    const entry = placedPieces.get(fromSq);
    if (!entry) return;
    if (placedPieces.has(toSq)) return;

    const toCoords = getTileCoordinates(toSq);
    if (!isAllowedPlacement(entry.color, toSq)) return;

    if (
      entry.type === "pawn" &&
      !toCoords.isBench &&
      (toCoords.row === 0 || toCoords.row === 7)
    ) {
      console.warn("Pawns cannot be placed on the first or last ranks.");
      return;
    }

    entry.root.position.x = toCoords.col * tileSize - offset;
    entry.root.position.z = toCoords.zPos * tileSize - offset;
    entry.root.position.y = pieceYOffset[entry.type] || 0;

    entry.root.getChildMeshes().forEach((mesh) => {
      if (mesh.metadata) mesh.metadata.squareId = toSq;
    });

    placedPieces.delete(fromSq);
    placedPieces.set(toSq, entry);
    playSound(sounds.move);
    updateAnalysisBar();
  };

  const clearColor = (color) => {
    placedPieces.forEach((entry, squareId) => {
      if (entry.color === color) {
        removePiece(squareId);
      }
    });
  };

  const setAnalysisVisible = (visible) => {
    if (!analysisBarEl) {
      return;
    }
    analysisBarEl.classList.toggle("hidden", !visible);
  };

  const updateAnalysisBar = () => {
    if (!analysisFillEl) {
      return;
    }
    let ratio = 0.5;
    if (lastEvalScore) {
      const { type, value } = lastEvalScore;
      if (type === "mate") {
        ratio = value >= 0 ? 0.98 : 0.02;
      } else {
        const capped = Math.min(1000, Math.max(-1000, value));
        ratio = (capped + 1000) / 2000;
      }
    } else {
      let whiteValue = 0;
      let blackValue = 0;
      placedPieces.forEach((entry, sq) => {
        if (!sq.startsWith("bench")) {
          if (entry.color === "white") {
            whiteValue += entry.value;
          } else {
            blackValue += entry.value;
          }
        }
      });
      const total = whiteValue + blackValue;
      if (total > 0) {
        ratio = whiteValue / total;
      }
    }
    const clamped = Math.min(0.98, Math.max(0.02, ratio));
    analysisFillEl.style.height = `${Math.round(clamped * 100)}%`;
  };

  const randomizeAI = () => {
    if (!aiColor) {
      return;
    }
    clearColor(aiColor);
    const squares = tiles
      .map((tile) => tile.metadata.squareId)
      .filter((squareId) => {
        return isAllowedPlacement(aiColor, squareId);
      });
    for (let i = squares.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [squares[i], squares[j]] = [squares[j], squares[i]];
    }

    const placeRandomPiece = (squareId, type) => {
      selectedPiece = `${aiColor}-${type}`;
      placePiece(squareId);
    };

    squares.forEach((squareId) => {
      const affordable = Object.entries(pieceDefs).filter(([type, def]) => {
        const coords = getTileCoordinates(squareId);
        if (
          type === "pawn" &&
          !coords.isBench &&
          (coords.row === 0 || coords.row === 7)
        )
          return false;
        return counts[aiColor][type] < def.max && budgets[aiColor] >= def.value;
      });
      if (affordable.length === 0) {
        return;
      }
      const [type] = affordable[Math.floor(Math.random() * affordable.length)];
      placeRandomPiece(squareId, type);
    });

    selectedPiece = null;
    uiManager.clearSelection();
    updateUI();
  };

  const setSide = (color) => {
    playerColor = color;
    aiColor = color === "white" ? "black" : "white";
    uiManager.setPlayerColor(playerColor);
    uiManager.setSidePickerVisible(false);
    selectedPiece = null;
    uiManager.clearSelection();
    positionBenchTiles(playerColor);
    placedPieces.forEach((entry) => entry.root.dispose());
    placedPieces.clear();
    
    budgets.white = getPlayerTotalGold(playerState.level);
    budgets.black = getAIBudget(playerState.gold);
    
    Object.keys(counts.white).forEach((key) => {
      counts.white[key] = 0;
      counts.black[key] = 0;
    });
    uiManager.renderShop(currentShop, playerState);
    updateUI();
    randomizeAI();
  };

  // Chess Engine & Battle Logic
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

  const fromAlgebraic = (sq) => {
    const col = sq.charCodeAt(0) - 97;
    const row = 8 - parseInt(sq[1]);
    return { row, col };
  };

  const executeEngineMove = (move) => {
    console.log("Executing move:", move, "Current turn:", currentTurn);
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const fromCoord = fromAlgebraic(from);
    const toCoord = fromAlgebraic(to);

    const fromSq = `${fromCoord.row}-${fromCoord.col}`;
    const toSq = `${toCoord.row}-${toCoord.col}`;

    const piece = placedPieces.get(fromSq);
    const actualKey = fromSq;

    if (!piece) {
      console.error(
        "Move FAILED: No piece for turn",
        currentTurn,
        "at",
        fromSq,
      );
      if (gameInProgress && desyncRetries < MAX_DESYNC_RETRIES) {
        desyncRetries += 1;
        console.warn("Resyncing engine position after desync attempt.");
        initialFen = generateFEN(placedPieces, currentTurn);
        moveHistory = [];
        requestEngineMove();
        return;
      }
      resolveAnnihilation();
      return;
    }

    const isCapture = placedPieces.has(toSq);
    let capturedPiece = false;

    if (piece.type === "pawn" && fromCoord.col !== toCoord.col && !isCapture) {
      const epSq = `${fromCoord.row}-${toCoord.col}`;
      if (placedPieces.has(epSq)) {
        console.log("En Passant capture! Removing piece at", epSq);
        removePiece(epSq, true);
        capturedPiece = true;
      }
    }
    if (isCapture) {
      console.log("Capture! Removing piece at", toSq);
      removePiece(toSq, true);
      capturedPiece = true;
    }

    // Stagnation Logic: Reset count if a pawn moves or a piece is captured
    if (piece.type === "pawn" || capturedPiece) {
      noMoveCount = 0;
    } else {
      noMoveCount++;
    }

    piece.root.position.x = toCoord.col * tileSize - offset;
    piece.root.position.z = toCoord.row * tileSize - offset;

    piece.root.getChildMeshes().forEach((mesh) => {
      if (mesh.metadata) mesh.metadata.squareId = toSq;
    });

    placedPieces.delete(actualKey);
    placedPieces.set(toSq, piece);

    const isPromotion = move.length > 4;
    if (isPromotion) {
      const promoChar = move[4].toLowerCase();
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
      };
      const newType = promoMap[promoChar] || "queen";

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
        newRoot.getChildMeshes().forEach((mesh) => {
          applyOpaqueMaterial(
            mesh,
            piece.color === "white" ? baseWhite : baseBlack,
          );
          mesh.metadata = { squareId: toSq, isPiece: true };
        });
        piece.root = newRoot;
        oldRoot.dispose();
      }
    }

    if (isPromotion) {
      playSound(sounds.promote);
    } else if (capturedPiece) {
      playSound(sounds.capture);
    } else {
      playSound(sounds.move);
    }
    updateAnalysisBar();

    moveHistory.push(move);
    desyncRetries = 0;

    currentTurn = currentTurn === "white" ? "black" : "white";
    updateTimerVisuals(currentTurn);
    
    // Check if the battle has stagnated for 20 plies (10 full turns)
    if (noMoveCount >= 20) {
      console.log("Battle stagnated! Resolving by material...");
      alert("Battle stagnated with no captures! Resolving based on surviving material...");
      resolveAnnihilation();
      return;
    }

    checkFinalWinner();
    if (gameInProgress) {
      requestEngineMove();
    }
  };

  let preCombatPlayerState = [];

  const endCombat = (playerWon, damageTaken, timeout = false) => {
    gameInProgress = false;
    
    if (timerInterval) clearInterval(timerInterval);
    timerContainer.style.display = "none";
    
    uiManager.setStartBattleState({ inProgress: false });
    setAnalysisVisible(false);

    if (timeout) {
      if (!playerWon) {
        playerState.hp -= damageTaken;
        if (playerState.hp <= 0) {
          alert(`Time's up! You lost on time. Game Over! You survived to Round ${playerState.level}.`);
          location.reload();
          return;
        } else {
          alert(`Time's up! You lost the round on time! Took ${damageTaken} damage.`);
        }
      } else {
        alert("Time's up! Black lost on time. You won the round!");
      }
    } else if (!playerWon && damageTaken > 0) {
      playerState.hp -= damageTaken;
      if (playerState.hp <= 0) {
        alert(`Game Over! You survived to Round ${playerState.level}.`);
        location.reload();
        return;
      } else {
        alert(`You lost the round! Took ${damageTaken} damage.`);
      }
    } else if (playerWon) {
      alert("You won the round!");
    } else {
      alert("Round ended in a draw!");
    }

    playerState.level += 1;
    playerState.gold += 5; // +5 Gold per round

    // Refund the player's pre-combat board pieces so they don't lose their gold
    preCombatPlayerState.forEach((saved) => {
      playerState.gold += pieceDefs[saved.type].value;
    });

    // Clean the board: remove all pieces from the main board (keep bench pieces safe)
    const toRemove = [];
    placedPieces.forEach((entry, sq) => {
      const isPlayerBench =
        sq.startsWith("bench") && entry.color === playerColor;
      if (!isPlayerBench) toRemove.push(sq);
    });
    
    toRemove.forEach((sq) => {
      const piece = placedPieces.get(sq);
      if (piece && piece.root) {
        piece.root.dispose();
      }
      placedPieces.delete(sq);
    });

    selectedPiece = null;

    // Generate new shop
    generateShopItems();

    // Generate new AI based on new scaling parameters
    budgets.black = getAIBudget(playerState.gold);
    Object.keys(counts.black).forEach((k) => (counts.black[k] = 0));
    randomizeAI();

    updateUI();
  };

  const checkFinalWinner = () => {
    let whiteBoardLeft = false;
    let blackBoardLeft = false;

    placedPieces.forEach((p, sq) => {
      if (!sq.startsWith("bench")) {
        if (p.color === "white") whiteBoardLeft = true;
        if (p.color === "black") blackBoardLeft = true;
      }
    });

    if (!whiteBoardLeft && !blackBoardLeft) {
      endCombat(false, 0); // Draw
    } else if (!whiteBoardLeft) {
      let blackValue = 0;
      placedPieces.forEach((p, sq) => {
        if (p.color === "black" && !sq.startsWith("bench"))
          blackValue += p.value;
      });
      endCombat(false, blackValue); // Black wins
    } else if (!blackBoardLeft) {
      endCombat(true, 0); // White wins
    }
  };

  function resolveAnnihilation() {
    let whiteValue = 0;
    let blackValue = 0;
    placedPieces.forEach((entry, sq) => {
      if (!sq.startsWith("bench")) {
        if (entry.color === "white") {
          whiteValue += entry.value;
        } else {
          blackValue += entry.value;
        }
      }
    });

    if (whiteValue === 0 && blackValue === 0) {
      endCombat(false, 0);
    } else if (whiteValue === 0) {
      endCombat(false, blackValue);
    } else if (blackValue === 0) {
      endCombat(true, 0);
    } else if (whiteValue >= blackValue) {
      endCombat(true, 0);
    } else {
      endCombat(false, blackValue - whiteValue);
    }
  }

  const requestEngineMove = () => {
    if (!gameInProgress) return;

    moveStartTime = Date.now(); 
    const historyStr =
      moveHistory.length > 0 ? " moves " + moveHistory.join(" ") : "";
    const positionCmd = `position fen ${initialFen}${historyStr}`;
    console.log("Sending position:", positionCmd);

    engineClient.requestMove(positionCmd, "go movetime 3900"); 
  };

  const initEngine = () => {
    console.log("Initializing worker...");
    engineClient.onLine = (line) => {
      console.log("Engine says:", line);
      if (line.includes("score ")) {
        const match = line.match(/score (cp|mate) (-?\d+)/);
        if (match) {
          const type = match[1];
          let value = Number(match[2]);
          if (currentTurn === "black") {
            value *= -1;
          }
          lastEvalScore = { type, value };
          updateAnalysisBar();
        }
      }
    };
    engineClient.onBestMove = (move) => {
      console.log("Best move received:", move);
      
      const elapsed = Date.now() - moveStartTime;
      const delay = Math.max(0, 4000 - elapsed); 

      if (move && move !== "(none)" && move !== "null") {
        setTimeout(() => executeEngineMove(move), delay);
        return;
      }
      
      console.log("Battle concluded (no moves left).");
      if (!gameInProgress) {
        return;
      }
      
      setTimeout(() => resolveAnnihilation(), delay);
    };
    engineClient.startBattle(() => {
      if (gameInProgress) {
        requestEngineMove();
      }
    });
  };

  uiManager.onStartBattle = () => {
    if (gameInProgress) return;

    let hasBoardPieces = false;
    placedPieces.forEach((p, sq) => {
      if (p.color === "white" && !sq.startsWith("bench")) hasBoardPieces = true;
    });

    if (!hasBoardPieces) {
      alert("Place at least one piece on the board to fight!");
      return;
    }

    unlockAudio();
    gameInProgress = true;
    desyncRetries = 0;
    noMoveCount = 0; // Fix: Reset the stagnation counter for each new round!
    lastEvalScore = null;
    setAnalysisVisible(true);
    updateAnalysisBar();
    uiManager.setStartBattleState({ inProgress: true });
    currentTurn = "white";

    preCombatPlayerState = [];
    placedPieces.forEach((entry, squareId) => {
      if (entry.color === "white") {
        preCombatPlayerState.push({
          squareId: squareId,
          type: entry.type,
        });
      }
    });

    initialFen = generateFEN(placedPieces, "white");
    moveHistory = [];
    
    // Set up and display Timer UI 
    timeWhite = 180;
    timeBlack = 180;
    whiteTimerEl.innerText = "03:00";
    blackTimerEl.innerText = "03:00";
    timerContainer.style.display = "flex";
    updateTimerVisuals(currentTurn);

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (!gameInProgress) return;

      if (currentTurn === "white") {
        timeWhite--;
      } else {
        timeBlack--;
      }

      const formatTime = (t) => {
        const m = Math.floor(t / 60).toString().padStart(2, "0");
        const s = (t % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
      };

      whiteTimerEl.innerText = formatTime(Math.max(0, timeWhite));
      blackTimerEl.innerText = formatTime(Math.max(0, timeBlack));

      if (timeWhite <= 0) {
        clearInterval(timerInterval);
        endCombat(false, 15, true); // White lost on time (15 damage penalty)
      } else if (timeBlack <= 0) {
        clearInterval(timerInterval);
        endCombat(true, 0, true); // Black lost on time
      }
    }, 1000);

    initEngine();
  };

  uiManager.onPickSide = (color) => setSide(color);
  uiManager.onClearBoard = () => {
    if (!playerColor) {
      return;
    }
    clearColor(playerColor);
    updateUI();
  };
  uiManager.onPieceSelected = (pieceId) => {
    selectedPiece = pieceId;
    if (selectedPiece) {
      const [color, type] = selectedPiece.split("-");
      updatePreview(type, color);
    }
  };

  scene.onPointerObservable.add((pointerInfo) => {
    if (gameInProgress) {
      return;
    }
    const isPointerDown = pointerInfo.type === PointerEventTypes.POINTERDOWN;
    const isPointerUp = pointerInfo.type === PointerEventTypes.POINTERUP;
    const isPointerMove = pointerInfo.type === PointerEventTypes.POINTERMOVE;
    if (!isPointerDown && !isPointerUp && !isPointerMove) {
      return;
    }

    if (isPointerDown) {
      const isRightClick = pointerInfo.event?.button === 2;
      if (isRightClick) {
        const pick = scene.pick(
          scene.pointerX,
          scene.pointerY,
          (mesh) => !!mesh.metadata?.isPiece,
        );
        if (pick?.hit && pick.pickedMesh?.metadata?.squareId) {
          const squareId = pick.pickedMesh.metadata.squareId;
          const entry = placedPieces.get(squareId);
          if (entry) {
            const label = pieceLabels[entry.type] || entry.type;
            const info =
              pieceMoves[entry.type] || "No movement info available.";
            uiManager.showMoveModal(`${label} (Cost: 💎 ${entry.value})`, info);
          }
        }
        return;
      }
    }

    if (!scene.metadata) {
      scene.metadata = {};
    }
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

    if (isPointerDown) {
      const pickPiece = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (mesh) => !!mesh.metadata?.isPiece,
      );
      if (pickPiece?.hit && pickPiece.pickedMesh?.metadata?.squareId) {
        const squareId = pickPiece.pickedMesh.metadata.squareId;
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
          ghost.getChildMeshes().forEach((mesh) => {
            mesh.material = entry.color === "white" ? ghostWhite : ghostBlack;
            mesh.isPickable = false;
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

    if (isPointerMove && dragState.active) {
      const pointerX = pointerInfo.event?.clientX ?? 0;
      const pointerY = pointerInfo.event?.clientY ?? 0;
      const isHoveringSell = uiManager.isPointerOverSellZone(
        pointerX,
        pointerY,
      );
      uiManager.highlightSellZone(isHoveringSell);

      const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (mesh) => !!mesh.metadata?.squareId && !mesh.metadata?.isPiece,
      );
      if (!pick?.hit || !pick.pickedMesh?.metadata?.squareId) {
        return;
      }
      const squareId = pick.pickedMesh.metadata.squareId;

      const coords = getTileCoordinates(squareId);
      if (!isAllowedPlacement(dragState.entry.color, squareId)) {
        return;
      }
      dragState.ghost.position.x = coords.col * tileSize - offset;
      dragState.ghost.position.z = coords.zPos * tileSize - offset;

      dragState.ghost.position.y = pieceYOffset[dragState.entry.type] || 0;
      dragState.toSq = squareId;
      return;
    }

    if (isPointerUp && dragState.active) {
      const pointerX = pointerInfo.event?.clientX ?? 0;
      const pointerY = pointerInfo.event?.clientY ?? 0;
      const isSelling = uiManager.isPointerOverSellZone(pointerX, pointerY);

      if (isSelling) {
        playerState.gold += dragState.sellValue;
        removePiece(dragState.fromSq);
        uiManager.renderShop(currentShop, playerState);
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
      if (dragState.ghost) {
        dragState.ghost.dispose();
      }
      uiManager.hideSellZone();
      camera.attachControl(canvas, true);
      dragState.active = false;
      dragState.fromSq = null;
      dragState.toSq = null;
      dragState.entry = null;
      dragState.ghost = null;
      dragState.sellValue = 0;
      return;
    }

    if (!isPointerDown || dragState.active) {
      return;
    }
  });

  await loadPieces();
  initPreview();
  updateUI();
  generateShopItems();
  return scene;
};

const scene = await createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
  if (previewEngine) {
    previewEngine.resize();
  }
});
