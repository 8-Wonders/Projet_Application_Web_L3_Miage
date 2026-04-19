import "./style.css";
import { SceneManager } from "./rendering/SceneManager.js";
import { GameController } from "./game/GameController.js";

const canvas = document.getElementById("renderCanvas");
const previewCanvas = document.getElementById("previewCanvas");
const previewNameEl = document.getElementById("previewName");

const sceneManager = new SceneManager(canvas);

const controller = new GameController({
  sceneManager,
  canvas,
  previewCanvas,
  previewNameEl,
});

await controller.init();
