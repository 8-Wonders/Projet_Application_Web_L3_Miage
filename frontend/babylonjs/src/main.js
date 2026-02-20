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

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true, { audioEngine: true });
const previewCanvas = document.getElementById("previewCanvas");
const previewNameEl = document.getElementById("previewName");
const moveModal = document.getElementById("moveModal");
const moveTitleEl = document.getElementById("moveTitle");
const moveTextEl = document.getElementById("moveText");
const closeMoveButton = document.getElementById("closeMove");
const aboutMoveButton = document.getElementById("aboutMove");
const analysisBarEl = document.getElementById("analysisBar");
const analysisFillEl = document.getElementById("analysisFill");
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
  const pieceDefs = {
    pawn: { value: 1, max: 8 },
    rook: { value: 5, max: 2 },
    knight: { value: 3, max: 2 },
    bishop: { value: 3, max: 2 },
    queen: { value: 9, max: 1 },
    camel: { value: 3, max: 2 },
    wizzard: { value: 3, max: 2 },
    archbishop: { value: 7, max: 2 },
    chancellor: { value: 8, max: 2 },
    amazon: { value: 12, max: 1 },
    immobilizer: { value: 5, max: 1 },
    fool: { value: 0, max: 1 },
    mammoth: { value: 5, max: 2 },
  };
  const pieceAssets = {
    pawn: { file: "Pawn.glb", height: 1.4 },
    rook: { file: "Rook.glb", height: 1.5 },
    knight: { file: "Knight.glb", height: 1.6 },
    bishop: { file: "Bishop.glb", height: 1.6 },
    queen: { file: "Queen.glb", height: 1.8 },
    camel: { file: "camel.stl", height: 1.6 },
    wizzard: { file: "wizzard.stl", height: 1.4 },
    archbishop: { file: "Archbishop21.stl", height: 1.8 },
    chancellor: { file: "Marshall.stl", height: 1.8 },
    amazon: { file: "Amazon_Dragon.stl", height: 2.2 },
    immobilizer: { file: "Immobilizer.stl", height: 1.8 },
    fool: { file: "fool.stl", height: 1.2 },
    mammoth: { file: "Mammoth.stl", height: 2 },
  };
  const pieceMoves = {
    pawn: "Forward 1 square (2 from starting rank), captures 1 square diagonally forward.",
    rook: "Any number of squares vertically or horizontally.",
    knight: "L-shape: 2 squares in one direction, then 1 perpendicular. Jumps.",
    bishop: "Any number of squares diagonally.",
    queen: "Any number of squares vertically, horizontally, or diagonally.",
    camel: "Leaps in a (3,1) L-shape. Jumps.",
    wizzard:
      "Combines Ferz and Camel: Ferz moves 1 square diagonally; Camel is a (3,1) leaper. Jumps.",
    archbishop: "Bishop or knight (combined).",
    chancellor: "Rook or knight (combined).",
    amazon: "Queen or knight (combined).",
    immobilizer:
      "Moves like a queen but cannot capture. Freezing aura is not enforced in the engine.",
    fool: "Cannot move or capture.",
    mammoth:
      "King + Alfil + Dabbaba: 1 square any direction, or a 2-square diagonal/orthogonal leap. Jumps.",
  };
  const pieceLabels = {
    pawn: "Pawn",
    rook: "Rook",
    knight: "Knight",
    bishop: "Bishop",
    queen: "Queen",
    camel: "Camel",
    wizzard: "Wizard",
    archbishop: "Archbishop",
    chancellor: "Chancellor",
    amazon: "Amazon",
    immobilizer: "Immobilizer",
    fool: "Fool",
    mammoth: "Mammoth",
  };

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
  const pieceYawFix = {
    knight: -Math.PI / 2,
  };
  const pieceYOffset = {
    pawn: 0.12,
    rook: 0.12,
    knight: 0.12,
    queen: 0.12,
  };
  const showMoveModal = (type) => {
    if (!moveModal || !moveTitleEl || !moveTextEl) {
      return;
    }
    const label = pieceLabels[type] || type;
    moveTitleEl.textContent = `${label} movement`;
    moveTextEl.textContent = pieceMoves[type] || "No movement info available.";
    moveModal.classList.remove("hidden");
  };

  const hideMoveModal = () => {
    if (!moveModal) {
      return;
    }
    moveModal.classList.add("hidden");
  };

  if (closeMoveButton) {
    closeMoveButton.addEventListener("click", hideMoveModal);
  }
  if (moveModal) {
    moveModal.addEventListener("click", (event) => {
      if (event.target === moveModal) {
        hideMoveModal();
      }
    });
  }

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

  const getBounds = (meshes) => {
    let min = new Vector3(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );
    let max = new Vector3(
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    );
    meshes.forEach((mesh) => {
      if (!mesh.getBoundingInfo) {
        return;
      }
      // Ensure bounds are up to date for accurate scaling/placement.
      mesh.refreshBoundingInfo(true);
      mesh.computeWorldMatrix(true);
      const bounds = mesh.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, bounds.minimumWorld);
      max = Vector3.Maximize(max, bounds.maximumWorld);
    });
    return { min, max };
  };

  const normalizeMeshes = (name, meshes, root, targetHeight, targetScene) => {
    if (meshes.length === 0) {
      throw new Error(`No mesh data for ${name}`);
    }
    // Create a container for adjustment (scaling, centering)
    const adjuster = new TransformNode(`${name}-adjuster`, targetScene);
    adjuster.parent = root;

    // Re-parent meshes to the adjuster FIRST (while adjuster is at identity)
    meshes.forEach((mesh) => {
      mesh.setParent(adjuster);
    });

    const bounds = getBounds(meshes);
    const height = bounds.max.y - bounds.min.y;
    if (!Number.isFinite(height) || height <= 0) {
      throw new Error(`Invalid bounds for ${name}`);
    }

    const scale = targetHeight / height;
    const center = bounds.min.add(bounds.max).scale(0.5);
    const bottomCenter = new Vector3(center.x, bounds.min.y, center.z);

    // Move the bottom-center to the origin after scaling.
    adjuster.scaling = new Vector3(scale, scale, scale);
    adjuster.position = bottomCenter.scale(-scale);
  };

  const registerFromMeshes = (name, meshes, root, targetHeight) => {
    normalizeMeshes(name, meshes, root, targetHeight, scene);

    root.setEnabled(false);
    pieceTemplates[name] = root;
  };

  const registerShapePiece = (name, mesh, targetHeight) => {
    const root = new TransformNode(`${name}-root`, scene);
    // mesh.parent = root; // Will be reparented in registerFromMeshes
    registerFromMeshes(name, [mesh], root, targetHeight);
  };

  const registerAssetPiece = async (name, filename, targetHeight) => {
    console.log(`Loading asset: ${name} from ${filename}`);
    try {
      const result = await SceneLoader.ImportMeshAsync(
        "",
        "/assets/",
        filename,
        scene,
      );
      const root = new TransformNode(`${name}-root`, scene);
      const meshes = result.meshes.filter(
        (mesh) => mesh.getTotalVertices && mesh.getTotalVertices() > 0,
      );

      meshes.forEach((mesh) => {
        mesh.parent = root;
      });

      registerFromMeshes(name, meshes, root, targetHeight);
      console.log(`Successfully loaded: ${name}`);
    } catch (e) {
      console.error(`Failed to load ${name}:`, e);
      throw e;
    }
  };

  const loadPieces = async () => {
    const makePawn = () => {
      const mesh = MeshBuilder.CreateCylinder(
        "pawnBase",
        { height: 1.2, diameterTop: 0.7, diameterBottom: 0.9 },
        scene,
      );
      mesh.position.y = 0.6;
      registerShapePiece("pawn", mesh, 1.4);
    };
    const makeRook = () => {
      const mesh = MeshBuilder.CreateBox(
        "rookBase",
        { height: 1.4, width: 0.9, depth: 0.9 },
        scene,
      );
      mesh.position.y = 0.7;
      registerShapePiece("rook", mesh, 1.5);
    };
    const makeKnight = () => {
      const mesh = MeshBuilder.CreateSphere(
        "knightBase",
        { diameter: 1.2 },
        scene,
      );
      mesh.position.y = 0.6;
      registerShapePiece("knight", mesh, 1.6);
    };
    const makeBishop = () => {
      const mesh = MeshBuilder.CreateCylinder(
        "bishopBase",
        { height: 1.6, diameterTop: 0.5, diameterBottom: 0.9 },
        scene,
      );
      mesh.position.y = 0.8;
      registerShapePiece("bishop", mesh, 1.6);
    };
    const makeQueen = () => {
      const mesh = MeshBuilder.CreateCylinder(
        "queenBase",
        { height: 1.8, diameterTop: 0.8, diameterBottom: 1 },
        scene,
      );
      mesh.position.y = 0.9;
      registerShapePiece("queen", mesh, 1.8);
    };

    try {
      await registerAssetPiece("pawn", "Pawn.glb", 1.4);
    } catch {
      makePawn();
    }
    try {
      await registerAssetPiece("rook", "Rook.glb", 1.5);
    } catch {
      makeRook();
    }
    try {
      await registerAssetPiece("knight", "Knight.glb", 1.6);
    } catch {
      makeKnight();
    }
    try {
      await registerAssetPiece("bishop", "Bishop.glb", 1.6);
    } catch {
      makeBishop();
    }
    try {
      await registerAssetPiece("queen", "Queen.glb", 1.8);
    } catch {
      makeQueen();
    }

    try {
      await registerAssetPiece("camel", "camel.stl", 1.6);
    } catch {
      const camel = MeshBuilder.CreateCylinder(
        "camelBase",
        { height: 1.6, diameterTop: 0.4, diameterBottom: 1 },
        scene,
      );
      camel.position.y = 0.8;
      registerShapePiece("camel", camel, 1.6);
    }

    try {
      await registerAssetPiece("wizzard", "wizzard.stl", 1.4);
    } catch {
      const wizzard = MeshBuilder.CreateBox(
        "wizzardBase",
        { height: 1.4, width: 1, depth: 0.7 },
        scene,
      );
      wizzard.position.y = 0.7;
      registerShapePiece("wizzard", wizzard, 1.4);
    }

    try {
      await registerAssetPiece("archbishop", "Archbishop21.stl", 1.8);
    } catch {
      const archbishop = MeshBuilder.CreateCylinder(
        "archbishopBase",
        {
          height: 1.8,
          diameterTop: 0.5,
          diameterBottom: 1,
        },
        scene,
      );
      archbishop.position.y = 0.9;
      registerShapePiece("archbishop", archbishop, 1.8);
    }

    try {
      await registerAssetPiece("chancellor", "Marshall.stl", 1.8);
    } catch {
      const chancellor = MeshBuilder.CreateBox(
        "chancellorBase",
        { height: 1.8, width: 1, depth: 1 },
        scene,
      );
      chancellor.position.y = 0.9;
      registerShapePiece("chancellor", chancellor, 1.8);
    }

    try {
      await registerAssetPiece("amazon", "Amazon_Dragon.stl", 2.2);
    } catch {
      const amazon = MeshBuilder.CreateCylinder(
        "amazonBase",
        { height: 2.2, diameterTop: 0.8, diameterBottom: 1.1 },
        scene,
      );
      amazon.position.y = 1.1;
      registerShapePiece("amazon", amazon, 2.2);
    }

    try {
      await registerAssetPiece("immobilizer", "Immobilizer.stl", 1.8);
    } catch {
      const immobilizer = MeshBuilder.CreateBox(
        "immobilizerBase",
        { height: 1.8, width: 1, depth: 1 },
        scene,
      );
      immobilizer.position.y = 0.9;
      registerShapePiece("immobilizer", immobilizer, 1.8);
    }

    try {
      await registerAssetPiece("fool", "fool.stl", 1.2);
    } catch {
      const fool = MeshBuilder.CreateSphere(
        "foolBase",
        { diameter: 1 },
        scene,
      );
      fool.position.y = 0.6;
      registerShapePiece("fool", fool, 1.2);
    }

    try {
      await registerAssetPiece("mammoth", "Mammoth.stl", 2);
    } catch {
      const mammoth = MeshBuilder.CreateCylinder(
        "mammothBase",
        { height: 2, diameterTop: 1, diameterBottom: 1.2 },
        scene,
      );
      mammoth.position.y = 1;
      registerShapePiece("mammoth", mammoth, 2);
    }
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

  const budgetWhiteEl = document.getElementById("budgetWhite");
  const budgetBlackEl = document.getElementById("budgetBlack");
  const sidePicker = document.getElementById("sidePicker");
  const pickWhite = document.getElementById("pickWhite");
  const pickBlack = document.getElementById("pickBlack");
  const selectButtons = document.querySelectorAll(".piece-group .piece-btn");
  const groupWhite = document.querySelector('.piece-group[data-color="white"]');
  const groupBlack = document.querySelector('.piece-group[data-color="black"]');
  const updateUI = () => {
    if (!playerColor || !aiColor) {
      if (groupWhite) groupWhite.classList.add("hidden");
      if (groupBlack) groupBlack.classList.add("hidden");
    } else {
      const showWhite = playerColor === "white";
      if (groupWhite) groupWhite.classList.toggle("hidden", !showWhite);
      if (groupBlack) groupBlack.classList.toggle("hidden", showWhite);
    }

    if (budgetWhiteEl) {
      const label = playerColor
        ? playerColor === "white"
          ? "Your budget"
          : "AI budget"
        : "White budget";
      budgetWhiteEl.textContent = `${label}: ${budgets.white}`;
    }
    if (budgetBlackEl) {
      const label = playerColor
        ? playerColor === "black"
          ? "Your budget"
          : "AI budget"
        : "Black budget";
      budgetBlackEl.textContent = `${label}: ${budgets.black}`;
    }

    selectButtons.forEach((button) => {
      if (!playerColor) {
        button.disabled = true;
        button.classList.remove("active");
        return;
      }
      const [color, type] = button.dataset.piece.split("-");
      if (color !== playerColor) {
        button.disabled = true;
        button.classList.remove("active");
        return;
      }
      const { value, max } = pieceDefs[type];
      const canAfford = budgets[color] >= value && counts[color][type] < max;
      button.disabled = !canAfford;
      if (!canAfford && button.classList.contains("active")) {
        button.classList.remove("active");
        selectedPiece = null;
      }
    });
  };

  selectButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }
      selectButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      selectedPiece = button.dataset.piece;
      if (selectedPiece) {
        const [color, type] = selectedPiece.split("-");
        updatePreview(type, color);
      }
    });
  });

  if (aboutMoveButton) {
    aboutMoveButton.addEventListener("click", () => {
      if (!selectedPiece) {
        if (moveModal && moveTitleEl && moveTextEl) {
          moveTitleEl.textContent = "Select a piece";
          moveTextEl.textContent =
            "Choose a piece first to see its movement rules.";
          moveModal.classList.remove("hidden");
        }
        return;
      }
      const [, type] = selectedPiece.split("-");
      showMoveModal(type);
    });
  }

  const clearButton = document.getElementById("clearBoard");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (!playerColor) {
        return;
      }
      clearColor(playerColor);
      updateUI();
    });
  }

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
    selectButtons.forEach((btn) => btn.classList.remove("active"));
    updateUI();
  };

  const setSide = (color) => {
    playerColor = color;
    aiColor = color === "white" ? "black" : "white";
    if (sidePicker) {
      sidePicker.classList.add("hidden");
    }
    selectedPiece = null;
    selectButtons.forEach((btn) => btn.classList.remove("active"));
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
  let engineWorker = null;
  let gameInProgress = false;
  let currentTurn = "white";
  let initialFen = "";
  let moveHistory = [];
  let desyncRetries = 0;
  const MAX_DESYNC_RETRIES = 2;
  let engineConfigured = false;
  let waitingForEngine = false;
  let noMoveCount = 0;

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
  const toPieceChar = (type, color) => {
    const chars = {
      pawn: "p",
      rook: "r",
      knight: "n",
      bishop: "b",
      queen: "q",
      camel: "c",
      wizzard: "w",
      archbishop: "a",
      chancellor: "h",
      amazon: "z",
      immobilizer: "i",
      fool: "f",
      mammoth: "m",
    };
    const c = chars[type] || "p";
    return color === "white" ? c.toUpperCase() : c.toLowerCase();
  };

  const generateFEN = (turn) => {
    let fen = "";

    let pieceCount = 0;

    for (let row = 0; row < 8; row++) {
      let empty = 0;

      for (let col = 0; col < 8; col++) {
        const squareId = `${row}-${col}`;

        const piece = placedPieces.get(squareId);

        if (piece) {
          pieceCount++;

          if (empty > 0) {
            fen += empty;

            empty = 0;
          }

          fen += toPieceChar(piece.type, piece.color);
        } else {
          empty++;
        }
      }

      if (empty > 0) {
        fen += empty;
      }

      if (row < 7) {
        fen += "/";
      }
    }

    fen += ` ${turn === "white" ? "w" : "b"} - - 0 1`;

    console.log("Generated FEN:", fen, "Pieces in FEN:", pieceCount);

    return fen;
  };

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
        initialFen = generateFEN(currentTurn);
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

    if (!gameInProgress && startBattleBtn) {
      startBattleBtn.textContent = "Fight!";
      startBattleBtn.disabled = false;
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
    if (startBattleBtn) {
      startBattleBtn.textContent = "Fight!";
      startBattleBtn.disabled = false;
    }
    setAnalysisVisible(false);
  }

  const requestEngineMove = () => {
    if (!gameInProgress) return;

    const historyStr =
      moveHistory.length > 0 ? " moves " + moveHistory.join(" ") : "";
    const positionCmd = `position fen ${initialFen}${historyStr}`;
    console.log("Sending position:", positionCmd);

    engineWorker.postMessage(positionCmd);
    engineWorker.postMessage("go movetime 5000");
  };

  const configureEngineForBattle = () => {
    if (!engineWorker) {
      return;
    }
    engineConfigured = false;
    engineWorker.postMessage("setoption name UCI_Variant value mychess");
    engineWorker.postMessage("ucinewgame");
    engineWorker.postMessage("isready");
  };

  const initEngine = () => {
    if (engineWorker) {
      configureEngineForBattle();
      return;
    }

    console.log("Initializing worker...");
    engineWorker = new Worker(
      new URL("/engine/chess-worker.js", window.location.origin),
    );

    engineWorker.onerror = (err) => {
      console.error("Worker Error:", err);
    };

    engineWorker.onmessage = (e) => {
      const line = e.data;
      console.log("Engine says:", line);

      if (line === "ready") {
        console.log("Engine ready. Sending configuration...");
        engineWorker.postMessage("uci");
      } else if (line === "uciok") {
        configureEngineForBattle();
      } else if (line === "readyok") {
        console.log("Engine configured and ready. Starting battle.");
        engineConfigured = true;
        if (gameInProgress && waitingForEngine) {
          waitingForEngine = false;
          requestEngineMove();
        }
      } else if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        console.log("Best move received:", move);
        if (move && move !== "(none)" && move !== "null") {
          setTimeout(() => executeEngineMove(move), 300);
        } else {
          console.log("Battle concluded (no move).");
          if (!gameInProgress) {
            return;
          }
          noMoveCount += 1;
          if (noMoveCount >= 2) {
            alert("No legal moves for either side.");
            gameInProgress = false;
            if (startBattleBtn) {
              startBattleBtn.textContent = "Fight!";
              startBattleBtn.disabled = false;
            }
            setAnalysisVisible(false);
            return;
          }
          currentTurn = currentTurn === "white" ? "black" : "white";
          initialFen = generateFEN(currentTurn);
          moveHistory = [];
          requestEngineMove();
        }
      }
    };
  };

  const startBattleBtn = document.getElementById("startBattle");
  if (startBattleBtn) {
    startBattleBtn.addEventListener("click", () => {
      if (gameInProgress) return;

      unlockAudio();
      gameInProgress = true;
      waitingForEngine = true;
      engineConfigured = false;
      desyncRetries = 0;
      setAnalysisVisible(true);
      updateAnalysisBar();
      startBattleBtn.textContent = "Battle in progress...";
      startBattleBtn.disabled = true;
      currentTurn = "white";

      initialFen = generateFEN("white");
      moveHistory = [];

      initEngine();
    });
  }

  if (pickWhite) {
    pickWhite.addEventListener("click", () => setSide("white"));
  }
  if (pickBlack) {
    pickBlack.addEventListener("click", () => setSide("black"));
  }

  scene.onPointerObservable.add((pointerInfo) => {
    if (gameInProgress) {
      return;
    }
    const isPointerDown =
      pointerInfo.type === PointerEventTypes.POINTERDOWN;
    const isPointerUp = pointerInfo.type === PointerEventTypes.POINTERUP;
    const isPointerMove =
      pointerInfo.type === PointerEventTypes.POINTERMOVE;
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
            mesh.material =
              entry.color === "white" ? ghostWhite : ghostBlack;
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
