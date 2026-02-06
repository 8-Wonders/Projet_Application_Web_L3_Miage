import { Player } from "./player.js";
import { Map } from "./map.js";
import { AssetLoader } from "./assetLoader.js";
import { keys, handleInput } from "./input.js";

let canvas, ctx, player, map;

async function init() {
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");

  const loader = new AssetLoader();
  loader.addImage(0, "assets/grass.png");
  loader.addImage(1, "assets/brick.png");
  loader.addImage(2, "assets/water.png");
  loader.addImage(3, "assets/stone.png");

  console.log("Loading assets...");
  const loadedTextures = await loader.loadAll();
  console.log("Assets loaded!");

  const TILE_SIZE = 50;
  map = new Map(TILE_SIZE, loadedTextures);
  await map.loadLevel("assets/maps/01.csv");

  if (map.level.length > 0) {
    canvas.width = map.level[0].length * TILE_SIZE;
    canvas.height = map.level.length * TILE_SIZE;
  }

  player = new Player(40, 100, TILE_SIZE, TILE_SIZE * 2, "black");
  player.x = 100;
  player.y = 100;

  resize();
  window.addEventListener("resize", resize);

  handleInput(player);

  gameLoop();
}

function resize() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  const scale = Math.min(
    windowWidth / canvas.width,
    windowHeight / canvas.height,
  );

  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;

  // Center the canvas
  canvas.style.position = "absolute";
  canvas.style.left = "50%";
  canvas.style.top = "50%";
  canvas.style.transform = "translate(-50%, -50%)";
  canvas.style.margin = "0";
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  map.draw(ctx);
  player.move(keys, map);
  player.draw(ctx);

  requestAnimationFrame(gameLoop);
}

window.onload = init;

