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

  const START_BUDGET = 39;

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
  // Move modal is managed by UIManager.

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

  const placedPieces = new Map();
  const budgets = { white: START_BUDGET, black: START_BUDGET };
  const counts = {
    white: Object.fromEntries(Object.keys(pieceDefs).map((key) => [key, 0])),
    black: Object.fromEntries(Object.keys(pieceDefs).map((key) => [key, 0])),
  };
  let selectedPiece = null;
  let playerColor = null;
  let aiColor = null;

  const updateUI = () => {
    uiManager.setPieceVisibility(playerColor, aiColor);
    uiManager.setBudgets(budgets, playerColor);
    uiManager.updateAvailability(budgets, counts, playerColor);
  };

  // About-move is handled in UIManager.

  // Clear button is handled by UIManager.

  const removePiece = (squareId) => {
    const existing = placedPieces.get(squareId);
    if (!existing) {
      return;
    }
    existing.root.dispose();
    placedPieces.delete(squareId);
    budgets[existing.color] += existing.value;
    counts[existing.color][existing.type] = Math.max(
      0,
      counts[existing.color][existing.type] - 1,
    );
  };

  const isAllowedRow = (color, row) => {
    return color === "white" ? row >= 4 : row <= 3;
  };

  const placePiece = (squareId, row, col) => {
    if (!selectedPiece) {
      return;
    }

    const [color, type] = selectedPiece.split("-");

    const def = pieceDefs[type];
    if (!def) {
      return;
    }
    if (counts[color][type] >= def.max || budgets[color] < def.value) {
      return;
    }

    if (!isAllowedRow(color, row)) {
      return;
    }

    removePiece(squareId);

    const base = pieceTemplates[type];
    if (!base || budgets[color] < def.value || counts[color][type] >= def.max) {
      return;
    }

    const instanceRoot = base.clone(
      `${selectedPiece}-${squareId}`,
      null,
      false,
    );
    console.log(`Placed piece: ${selectedPiece} at ${squareId}`);
    instanceRoot.setEnabled(true);
    instanceRoot.position.x = col * tileSize - offset;
    instanceRoot.position.z = row * tileSize - offset;
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
    budgets[color] -= def.value;
    counts[color][type] += 1;
    updateUI();
    playSound(sounds.move);
    updateAnalysisBar();
  };

  const movePiece = (fromSq, toSq) => {
    if (fromSq === toSq) {
      return;
    }
    const entry = placedPieces.get(fromSq);
    if (!entry) {
      return;
    }
    if (placedPieces.has(toSq)) {
      return;
    }
    const [row, col] = toSq.split("-").map(Number);
    if (!isAllowedRow(entry.color, row)) {
      return;
    }
    entry.root.position.x = col * tileSize - offset;
    entry.root.position.z = row * tileSize - offset;
    entry.root.position.y = pieceYOffset[entry.type] || 0;
    entry.root.getChildMeshes().forEach((mesh) => {
      if (mesh.metadata) {
        mesh.metadata.squareId = toSq;
      }
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
    let whiteValue = 0;
    let blackValue = 0;
    placedPieces.forEach((entry) => {
      if (entry.color === "white") {
        whiteValue += entry.value;
      } else {
        blackValue += entry.value;
      }
    });
    const total = whiteValue + blackValue;
    let ratio = 0.5;
    if (total > 0) {
      ratio = whiteValue / total;
    }
    const clamped = Math.min(0.95, Math.max(0.05, ratio));
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
        const [row] = squareId.split("-").map((value) => Number(value));
        return isAllowedRow(aiColor, row);
      });
    for (let i = squares.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [squares[i], squares[j]] = [squares[j], squares[i]];
    }

    const placeRandomPiece = (squareId, type) => {
      const [row, col] = squareId.split("-").map((value) => Number(value));
      selectedPiece = `${aiColor}-${type}`;
      placePiece(squareId, row, col);
    };

    squares.forEach((squareId) => {
      const affordable = Object.entries(pieceDefs).filter(([type, def]) => {
        const [row] = squareId.split("-").map(Number);
        if (type === "pawn" && (row === 0 || row === 7)) return false;
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
    uiManager.setSidePickerVisible(false);
    selectedPiece = null;
    uiManager.clearSelection();
    placedPieces.forEach((entry) => entry.root.dispose());
    placedPieces.clear();
    budgets.white = START_BUDGET;
    budgets.black = START_BUDGET;
    Object.keys(counts.white).forEach((key) => {
      counts.white[key] = 0;
      counts.black[key] = 0;
    });
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
  const engineClient = new EngineClient(
    new URL("/engine/chess-worker.js", window.location.origin),
  );

  const toAlgebraic = (row, col) => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  };

  const fromAlgebraic = (sq) => {
    const col = sq.charCodeAt(0) - 97;
    const row = 8 - parseInt(sq[1]);
    return { row, col };
  };

  const mapAlgebraicCoord = (sq, mode) => {
    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq[1]);
    const base = { row: 8 - rank, col: file };
    switch (mode) {
      case "flip-row":
        return { row: 7 - base.row, col: base.col };
      case "flip-col":
        return { row: base.row, col: 7 - base.col };
      case "flip-both":
        return { row: 7 - base.row, col: 7 - base.col };
      case "transpose":
        return { row: base.col, col: base.row };
      case "transpose-flip-row":
        return { row: base.col, col: 7 - base.row };
      case "transpose-flip-col":
        return { row: 7 - base.col, col: base.row };
      case "transpose-flip-both":
        return { row: 7 - base.col, col: 7 - base.row };
      default:
        return base;
    }
  };
  // FEN generation lives in src/game/fen.js.

  const executeEngineMove = (move) => {
    console.log("Executing move:", move, "Current turn:", currentTurn);
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    let fromCoord = fromAlgebraic(from);
    let toCoord = fromAlgebraic(to);

    const fromSq = `${fromCoord.row}-${fromCoord.col}`;
    const toSq = `${toCoord.row}-${toCoord.col}`;

    let piece = placedPieces.get(fromSq);
    let actualKey = fromSq;

    if (!piece) {
      const altModes = [
        "flip-row",
        "flip-col",
        "flip-both",
        "transpose",
        "transpose-flip-row",
        "transpose-flip-col",
        "transpose-flip-both",
      ];
      for (const mode of altModes) {
        const altFrom = mapAlgebraicCoord(from, mode);
        const altTo = mapAlgebraicCoord(to, mode);
        const altSq = `${altFrom.row}-${altFrom.col}`;
        const altPiece = placedPieces.get(altSq);
        if (altPiece && altPiece.color === currentTurn) {
          console.warn("Move coords remapped using", mode);
          fromCoord = altFrom;
          toCoord = altTo;
          piece = altPiece;
          actualKey = altSq;
          break;
        }
      }
    }

    if (!piece) {
      console.warn("Piece not found at", fromSq, "Scanning map...");
      for (const [key, p] of placedPieces.entries()) {
        if (p.color === currentTurn) {
          console.log("  Found", p.color, p.type, "at", key);
        }
        const [r, c] = key.split("-").map(Number);
        if (r === fromCoord.row && c === fromCoord.col) {
          console.log("  Match found at key:", key);
          piece = p;
          actualKey = key;
          break;
        }
      }
    }

    if (!piece) {
      console.error(
        "Move FAILED: No piece for turn",
        currentTurn,
        "at",
        fromSq,
      );
      console.log("History:", moveHistory);
      console.log("Initial FEN:", initialFen);
      console.log("Available keys:", Array.from(placedPieces.keys()));
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
    if (isCapture) {
      console.log("Capture! Removing piece at", toSq);
      removePiece(toSq);
    }

    // Move animation (instant for now)
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

      // Update logic state
      piece.type = newType;

      // Swap the 3D mesh
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
    const isCastling =
      piece.type === "king" && Math.abs(fromCoord.col - toCoord.col) === 2;
    if (isPromotion) {
      playSound(sounds.promote);
    } else if (isCapture) {
      playSound(sounds.capture);
    } else if (isCastling) {
      playSound(sounds.castle);
    } else {
      playSound(sounds.move);
    }
    updateAnalysisBar();
    // ------------------------------------------

    moveHistory.push(move);
    noMoveCount = 0;
    desyncRetries = 0;

    currentTurn = currentTurn === "white" ? "black" : "white";
    checkFinalWinner();
    if (gameInProgress) {
      requestEngineMove();
    }
  };

  const checkFinalWinner = () => {
    const whiteLeft = Array.from(placedPieces.values()).some(
      (p) => p.color === "white",
    );
    const blackLeft = Array.from(placedPieces.values()).some(
      (p) => p.color === "black",
    );

    if (!whiteLeft && !blackLeft) {
      alert("It's a draw!");
      gameInProgress = false;
    } else if (!whiteLeft) {
      alert("Black wins the battle!");
      gameInProgress = false;
    } else if (!blackLeft) {
      alert("White wins the battle!");
      gameInProgress = false;
    }

    if (!gameInProgress) {
      uiManager.setStartBattleState({ inProgress: false });
    }
    if (!gameInProgress) {
      setAnalysisVisible(false);
    }
  };

  function resolveAnnihilation() {
    let whiteValue = 0;
    let blackValue = 0;
    placedPieces.forEach((entry) => {
      if (entry.color === "white") {
        whiteValue += entry.value;
      } else {
        blackValue += entry.value;
      }
    });
    if (whiteValue === 0 && blackValue === 0) {
      alert("It's a draw!");
    } else if (whiteValue === 0) {
      alert("Black wins the battle!");
    } else if (blackValue === 0) {
      alert("White wins the battle!");
    } else if (whiteValue > blackValue) {
      alert("White wins on material!");
    } else if (blackValue > whiteValue) {
      alert("Black wins on material!");
    } else {
      alert("Battle ended in a draw!");
    }
    gameInProgress = false;
    uiManager.setStartBattleState({ inProgress: false });
    setAnalysisVisible(false);
  }

  const requestEngineMove = () => {
    if (!gameInProgress) return;

    const historyStr =
      moveHistory.length > 0 ? " moves " + moveHistory.join(" ") : "";
    const positionCmd = `position fen ${initialFen}${historyStr}`;
    console.log("Sending position:", positionCmd);

    engineClient.requestMove(positionCmd, "go movetime 5000");
  };

  const initEngine = () => {
    console.log("Initializing worker...");
    engineClient.onLine = (line) => {
      console.log("Engine says:", line);
    };
    engineClient.onBestMove = (move) => {
      console.log("Best move received:", move);
      if (move && move !== "(none)" && move !== "null") {
        setTimeout(() => executeEngineMove(move), 300);
        return;
      }
      console.log("Battle concluded (no move).");
      if (!gameInProgress) {
        return;
      }
      noMoveCount += 1;
      if (noMoveCount >= 2) {
        alert("No legal moves for either side.");
        gameInProgress = false;
        uiManager.setStartBattleState({ inProgress: false });
        setAnalysisVisible(false);
        return;
      }
      currentTurn = currentTurn === "white" ? "black" : "white";
      initialFen = generateFEN(placedPieces, currentTurn);
      moveHistory = [];
      requestEngineMove();
    };
    engineClient.startBattle(() => {
      if (gameInProgress) {
        requestEngineMove();
      }
    });
  };

  uiManager.onStartBattle = () => {
    if (gameInProgress) return;

    unlockAudio();
    gameInProgress = true;
    desyncRetries = 0;
    setAnalysisVisible(true);
    updateAnalysisBar();
    uiManager.setStartBattleState({ inProgress: true });
    currentTurn = "white";

    initialFen = generateFEN(placedPieces, "white");
    moveHistory = [];

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
          if (entry && entry.color === playerColor) {
            removePiece(squareId);
            updateUI();
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
          camera.detachControl();
          return;
        }
      }
    }

    if (isPointerMove && dragState.active) {
      const pick = scene.pick(
        scene.pointerX,
        scene.pointerY,
        (mesh) => !!mesh.metadata?.squareId && !mesh.metadata?.isPiece,
      );
      if (!pick?.hit || !pick.pickedMesh?.metadata?.squareId) {
        return;
      }
      const squareId = pick.pickedMesh.metadata.squareId;
      const [row, col] = squareId.split("-").map(Number);
      if (!isAllowedRow(dragState.entry.color, row)) {
        return;
      }
      dragState.ghost.position.x = col * tileSize - offset;
      dragState.ghost.position.z = row * tileSize - offset;
      dragState.ghost.position.y = pieceYOffset[dragState.entry.type] || 0;
      dragState.toSq = squareId;
      return;
    }

    if (isPointerUp && dragState.active) {
      const targetSq = dragState.toSq || dragState.fromSq;
      if (
        targetSq &&
        targetSq !== dragState.fromSq &&
        !placedPieces.has(targetSq)
      ) {
        movePiece(dragState.fromSq, targetSq);
      }
      if (dragState.ghost) {
        dragState.ghost.dispose();
      }
      camera.attachControl(canvas, true);
      dragState.active = false;
      dragState.fromSq = null;
      dragState.toSq = null;
      dragState.entry = null;
      dragState.ghost = null;
      return;
    }

    if (!isPointerDown || dragState.active) {
      return;
    }

    const pick = scene.pick(
      scene.pointerX,
      scene.pointerY,
      (mesh) => !!mesh.metadata?.squareId,
    );
    if (!pick?.hit || !pick.pickedMesh?.metadata?.squareId) {
      return;
    }

    const squareId = pick.pickedMesh.metadata.squareId;
    const [row, col] = squareId.split("-").map((value) => Number(value));
    placePiece(squareId, row, col);
  });

  await loadPieces();
  initPreview();
  updateUI();
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
