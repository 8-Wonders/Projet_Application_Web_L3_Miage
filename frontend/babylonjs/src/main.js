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
} from "@babylonjs/core";
import "@babylonjs/loaders";
import "./style.css";

const canvas = document.getElementById("renderCanvas");
const engine = new Engine(canvas, true);
canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

const createScene = async () => {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera("camera", Math.PI / 4, Math.PI / 3, 18, new Vector3(0, 0, 0), scene);
  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = 0.3;
  camera.upperBetaLimit = 1.2;
  camera.wheelDeltaPercentage = 0.01;

  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.9;

  const START_BUDGET = 39;
  const pieceDefs = {
    pawn: { value: 1, max: 8 },
    rook: { value: 5, max: 2 },
    knight: { value: 3, max: 2 },
    bishop: { value: 3, max: 2 },
    queen: { value: 9, max: 1 },
    king: { value: 0, max: 1 },
    camel: { value: 3, max: 2 },
    zebra: { value: 3, max: 2 },
    archbishop: { value: 7, max: 2 },
    chancellor: { value: 8, max: 2 },
    amazon: { value: 12, max: 1 },
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
      const tile = MeshBuilder.CreateBox(`tile-${row}-${col}`, { width: tileSize, depth: tileSize, height: 0.2 }, scene);
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

  const baseBlack = new StandardMaterial("blackPiece", scene);
  baseBlack.diffuseColor = new Color3(0.33, 0.24, 0.19);
  baseBlack.specularColor = new Color3(0.08, 0.08, 0.08);

  const pieceTemplates = {};

  const getBounds = (meshes) => {
    let min = new Vector3(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    let max = new Vector3(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    meshes.forEach((mesh) => {
      if (!mesh.getBoundingInfo) {
        return;
      }
      // Ensure world matrix is computed for accurate bounds
      mesh.computeWorldMatrix(true);
      const bounds = mesh.getBoundingInfo().boundingBox;
      min = Vector3.Minimize(min, bounds.minimumWorld);
      max = Vector3.Maximize(max, bounds.maximumWorld);
    });
    return { min, max };
  };

  const registerFromMeshes = (name, meshes, root, targetHeight) => {
    if (meshes.length === 0) {
      throw new Error(`No mesh data for ${name}`);
    }
    const { min, max } = getBounds(meshes);
    const height = max.y - min.y;
    if (!Number.isFinite(height) || height <= 0) {
      throw new Error(`Invalid bounds for ${name}`);
    }
    
    const scale = height > 0 ? targetHeight / height : 1;
    
    // Calculate center of the bounding box
    const center = min.add(max).scale(0.5);
    // We want to align the bottom-center of the mesh to the root's origin
    const bottomCenter = new Vector3(center.x, min.y, center.z);

    // Create a container for adjustment (scaling and centering)
    const adjuster = new TransformNode(`${name}-adjuster`, scene);
    adjuster.parent = root;
    
    // Re-parent meshes to the adjuster FIRST (while adjuster is at identity)
    meshes.forEach((mesh) => {
      mesh.setParent(adjuster);
    });

    // Now apply the transform to the adjuster to move the meshes to origin
    adjuster.scaling = new Vector3(scale, scale, scale);
    adjuster.position = bottomCenter.scale(-scale); 

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
        const result = await SceneLoader.ImportMeshAsync("", "/assets/", filename, scene);
        const root = new TransformNode(`${name}-root`, scene);
        const meshes = result.meshes.filter((mesh) => mesh.getTotalVertices && mesh.getTotalVertices() > 0);
        
        // Initial parenting to root to ensure they are together, though registerFromMeshes will move them
        meshes.forEach((mesh) => {
          mesh.parent = root;
        });
        
        registerFromMeshes(name, meshes, root, targetHeight);
        console.log(`Successfully loaded: ${name}`);
    } catch (e) {
        console.error(`Failed to load ${name}:`, e);
        throw e; // Rethrow to trigger fallback
    }
  };

  const loadPieces = async () => {
    const makePawn = () => {
      const mesh = MeshBuilder.CreateCylinder("pawnBase", { height: 1.2, diameterTop: 0.7, diameterBottom: 0.9 }, scene);
      mesh.position.y = 0.6;
      registerShapePiece("pawn", mesh, 1.4);
    };
    const makeRook = () => {
      const mesh = MeshBuilder.CreateBox("rookBase", { height: 1.4, width: 0.9, depth: 0.9 }, scene);
      mesh.position.y = 0.7;
      registerShapePiece("rook", mesh, 1.5);
    };
    const makeKnight = () => {
      const mesh = MeshBuilder.CreateSphere("knightBase", { diameter: 1.2 }, scene);
      mesh.position.y = 0.6;
      registerShapePiece("knight", mesh, 1.6);
    };
    const makeBishop = () => {
      const mesh = MeshBuilder.CreateCylinder("bishopBase", { height: 1.6, diameterTop: 0.5, diameterBottom: 0.9 }, scene);
      mesh.position.y = 0.8;
      registerShapePiece("bishop", mesh, 1.6);
    };
    const makeQueen = () => {
      const mesh = MeshBuilder.CreateCylinder("queenBase", { height: 1.8, diameterTop: 0.8, diameterBottom: 1 }, scene);
      mesh.position.y = 0.9;
      registerShapePiece("queen", mesh, 1.8);
    };
    const makeKing = () => {
      const mesh = MeshBuilder.CreateCylinder("kingBase", { height: 2, diameterTop: 0.7, diameterBottom: 1 }, scene);
      mesh.position.y = 1;
      registerShapePiece("king", mesh, 1.9);
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
      await registerAssetPiece("king", "King.glb", 1.9);
    } catch {
      makeKing();
    }

    try {
      await registerAssetPiece("camel", "camel.stl", 1.6);
    } catch {
      const camel = MeshBuilder.CreateCylinder("camelBase", { height: 1.6, diameterTop: 0.4, diameterBottom: 1 }, scene);
      camel.position.y = 0.8;
      registerShapePiece("camel", camel, 1.6);
    }

    const zebra = MeshBuilder.CreateBox("zebraBase", { height: 1.4, width: 1, depth: 0.7 }, scene);
    zebra.position.y = 0.7;
    registerShapePiece("zebra", zebra, 1.4);

    try {
      await registerAssetPiece("archbishop", "Archbishop21.stl", 1.8);
    } catch {
      const archbishop = MeshBuilder.CreateCylinder("archbishopBase", {
        height: 1.8,
        diameterTop: 0.5,
        diameterBottom: 1,
      }, scene);
      archbishop.position.y = 0.9;
      registerShapePiece("archbishop", archbishop, 1.8);
    }

    const chancellor = MeshBuilder.CreateBox("chancellorBase", { height: 1.8, width: 1, depth: 1 }, scene);
    chancellor.position.y = 0.9;
    registerShapePiece("chancellor", chancellor, 1.8);

    try {
      await registerAssetPiece("amazon", "Amazon_Dragon.stl", 2.2);
    } catch {
      const amazon = MeshBuilder.CreateCylinder("amazonBase", { height: 2.2, diameterTop: 0.8, diameterBottom: 1.1 }, scene);
      amazon.position.y = 1.1;
      registerShapePiece("amazon", amazon, 2.2);
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
    });
  });

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
    counts[existing.color][existing.type] = Math.max(0, counts[existing.color][existing.type] - 1);
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

    const instanceRoot = base.clone(`${selectedPiece}-${squareId}`, null, false);
    console.log(`Placed piece: ${selectedPiece} at ${squareId}`);
    instanceRoot.setEnabled(true);
    instanceRoot.position.x = col * tileSize - offset;
    instanceRoot.position.z = row * tileSize - offset;
    instanceRoot.position.y = -0.1;
    instanceRoot.getChildMeshes().forEach((mesh) => {
      mesh.material = color === "white" ? baseWhite : baseBlack;
      mesh.metadata = { squareId, isPiece: true };
    });
    placedPieces.set(squareId, { root: instanceRoot, color, type, value: def.value });
    budgets[color] -= def.value;
    counts[color][type] += 1;
    updateUI();
  };

  const clearColor = (color) => {
    placedPieces.forEach((entry, squareId) => {
      if (entry.color === color) {
        removePiece(squareId);
      }
    });
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

    placeRandomPiece(squares.shift(), "king");

    squares.forEach((squareId) => {
      const affordable = Object.entries(pieceDefs).filter(([type, def]) => {
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

  if (pickWhite) {
    pickWhite.addEventListener("click", () => setSide("white"));
  }
  if (pickBlack) {
    pickBlack.addEventListener("click", () => setSide("black"));
  }

  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) {
      return;
    }

    const isRightClick = pointerInfo.event?.button === 2;
    if (isRightClick) {
      const pick = scene.pick(scene.pointerX, scene.pointerY, (mesh) => !!mesh.metadata?.isPiece);
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

    const pick = scene.pick(scene.pointerX, scene.pointerY, (mesh) => !!mesh.metadata?.squareId);
    if (!pick?.hit || !pick.pickedMesh?.metadata?.squareId) {
      return;
    }

    const squareId = pick.pickedMesh.metadata.squareId;
    const [row, col] = squareId.split("-").map((value) => Number(value));
    placePiece(squareId, row, col);
  });

  await loadPieces();
  updateUI();
  return scene;
};

const scene = await createScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
