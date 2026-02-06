import { Player } from "./player.js";
import { Bot } from "./bot.js"; // Import Bot
import { Map } from "./map.js";
import { AssetLoader } from "./assetLoader.js";
import { keys, handleInput } from "./input.js";

let canvas, ctx, map;
let players = [];
let turnIndex = 0;

async function init() {
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");

  const loader = new AssetLoader();
  loader.addImage(0, "assets/grass.png");
  loader.addImage(1, "assets/brick.png");
  loader.addImage(2, "assets/water.png");
  loader.addImage(3, "assets/stone.png");

  await loader.loadAll();

  const TILE_SIZE = 50;
  map = new Map(TILE_SIZE, await loader.loadAll());
  await map.loadLevel("assets/maps/01.csv");

  if (map.level.length > 0) {
    canvas.width = map.level[0].length * TILE_SIZE;
    canvas.height = map.level.length * TILE_SIZE;
  }

  // --- CREATE PLAYERS ---
  const p1 = new Player(40, 100, TILE_SIZE, TILE_SIZE * 2, "black");
  const bot = new Bot(200, 100, TILE_SIZE, TILE_SIZE * 2, "red");
  
  players = [p1, bot];
  
  // Start with Player 1
  players[0].startTurn();

  resize();
  window.addEventListener("resize", resize);

  // Initialize Input (We pass a getter function so input.js always knows who is active)
  handleInput(() => players[turnIndex]);

  gameLoop();
}

function resize() {
  /* ... same as before ... */
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const scale = Math.min(windowWidth / canvas.width, windowHeight / canvas.height);
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
  canvas.style.position = "absolute";
  canvas.style.left = "50%";
  canvas.style.top = "50%";
  canvas.style.transform = "translate(-50%, -50%)";
}

function nextTurn() {
  // End current player's turn
  players[turnIndex].endTurn();

  // Increment index
  turnIndex = (turnIndex + 1) % players.length;

  // Start new player's turn
  players[turnIndex].startTurn();
  console.log(`Turn switched to: ${turnIndex === 0 ? "Player" : "Bot"}`);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  map.draw(ctx);

  const currentPlayer = players[turnIndex];

  // --- LOGIC ---
  if (currentPlayer instanceof Bot) {
    // Bot Logic
    const turnEnded = currentPlayer.updateBotLogic(map);
    // Even if bot logic runs, we must call move() to update physics/arrows
    currentPlayer.move({}, map); 
    if (turnEnded) nextTurn();
  } else {
    // Human Logic
    // We pass 'keys' to move. If shoot() was triggered in input, check status
    currentPlayer.move(keys, map);
    
    // Check if human ended turn (fired shot)
    if (currentPlayer.hasFired) {
       // Allow the arrow to spawn before switching immediately? 
       // For this simple logic, we switch immediately.
       nextTurn();
    }
  }

  // Draw ALL players (even if not their turn)
  players.forEach(p => p.draw(ctx));

  requestAnimationFrame(gameLoop);
}

window.onload = init;
