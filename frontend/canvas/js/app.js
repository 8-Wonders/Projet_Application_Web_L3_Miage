import { Player } from "./player.js";
import { Map } from "./map.js";
import { AssetLoader } from "./assetLoader.js";

let canvas, ctx, player, map;
const keys = {};

async function init() {
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");

  canvas.width = 800;
  canvas.height = 600;

  const loader = new AssetLoader();
  loader.addImage(0, "assets/grass.png");
  loader.addImage(1, "assets/wall.png");
  loader.addImage(2, "assets/water.png");
  loader.addImage(3, "assets/stone.png");

  console.log("Loading assets...");
  const loadedTextures = await loader.loadAll();
  console.log("Assets loaded!");

  map = new Map(50, loadedTextures);
  await map.loadLevel('assets/maps/01.csv');

  player = Player.new();
  player.x = 100;
  player.y = 100;

  window.addEventListener("keydown", (e) => (keys[e.key] = true));
  window.addEventListener("keyup", (e) => (keys[e.key] = false));

  gameLoop();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  map.draw(ctx);
  player.move(keys, map);
  player.draw(ctx);

  requestAnimationFrame(gameLoop);
}

window.onload = init;
