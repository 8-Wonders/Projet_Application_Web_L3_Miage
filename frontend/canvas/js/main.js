import { Archer } from "./players/archer.js";
import { Mage } from "./players/mage.js";
import { Bot } from "./players/bot.js";
import { Map } from "./map.js";
import { AssetLoader } from "../../common/assetLoader.js";
import { keys, handleInput } from "./input.js";

const GAME_STATE = {
  MENU: 0,
  PLAYING: 1,
  LEVEL_TRANSITION: 2,
  GAME_OVER: 3,
  VICTORY: 4,
};

let canvas, ctx, map;
let players = [];
let turnIndex = 0;
let currentState = GAME_STATE.MENU;
let currentLevel = 1;
let selectedClass = null;
let loader;
let TILE_SIZE = 50;

let menuButtons = {};
let gameOverButton = {};
let victoryButton = {};

async function init() {
  canvas = document.querySelector("canvas");
  ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Load Assets
  loader = new AssetLoader();
  loader.addImage(0, "assets/grass.png");
  loader.addImage(1, "assets/brick.png");
  loader.addImage(2, "assets/water.png");
  loader.addImage(3, "assets/stone.png");

  await loader.loadAll();

  resize();
  window.addEventListener("resize", () => {
    // Keep full screen for non-playing states
    if (currentState !== GAME_STATE.PLAYING) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
  });

  // Mouse handling
  canvas.addEventListener("click", (e) => {
    // Attempt to play music on first interaction

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (currentState === GAME_STATE.MENU) {
      if (
        mouseX >= menuButtons.archer.x &&
        mouseX <= menuButtons.archer.x + menuButtons.archer.w &&
        mouseY >= menuButtons.archer.y &&
        mouseY <= menuButtons.archer.y + menuButtons.archer.h
      ) {
        startGame("archer");
      } else if (
        mouseX >= menuButtons.mage.x &&
        mouseX <= menuButtons.mage.x + menuButtons.mage.w &&
        mouseY >= menuButtons.mage.y &&
        mouseY <= menuButtons.mage.y + menuButtons.mage.h
      ) {
        startGame("mage");
      }
    } else if (currentState === GAME_STATE.GAME_OVER) {
      // Check Retry Button
      if (
        mouseX >= gameOverButton.x &&
        mouseX <= gameOverButton.x + gameOverButton.w &&
        mouseY >= gameOverButton.y &&
        mouseY <= gameOverButton.y + gameOverButton.h
      ) {
        // Go back to Menu (Class Choice)
        currentState = GAME_STATE.MENU;
        selectedClass = null;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        resize();
      }
    } else if (currentState === GAME_STATE.VICTORY) {
      // Check New Game Button
      if (
        mouseX >= victoryButton.x &&
        mouseX <= victoryButton.x + victoryButton.w &&
        mouseY >= victoryButton.y &&
        mouseY <= victoryButton.y + victoryButton.h
      ) {
        // Go to Main Menu
        currentState = GAME_STATE.MENU;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        resize();
      }
    }
  });

  // Input handling
  handleInput(() => {
    if (currentState === GAME_STATE.PLAYING && players.length > 0) {
      return players[turnIndex];
    }
    return null;
  });

  gameLoop();
}

function resize() {
  const windowWidth = window.innerWidth - 4;
  const windowHeight = window.innerHeight - 4;

  // Default to a reasonable size if canvas has no intrinsic size yet
  const cw = canvas.width || 800;
  const ch = canvas.height || 600;

  const scale = Math.min(windowWidth / cw, windowHeight / ch);
  canvas.style.width = `${cw * scale}px`;
  canvas.style.height = `${ch * scale}px`;
}

async function startGame(playerClass) {
  selectedClass = playerClass;
  currentLevel = 1;
  await loadLevel(currentLevel);
}

async function loadLevel(levelNum) {
  // 1. Enter Transition State
  currentState = GAME_STATE.LEVEL_TRANSITION;

  // Set to full screen for the transition message
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  resize();

  // 2. Load Map Data (in background)
  const mapFile = `assets/maps/0${levelNum}.csv`;
  map = new Map(TILE_SIZE, await loader.loadAll());
  await map.loadLevel(mapFile);

  // 3. Wait 2 seconds, then start playing
  setTimeout(() => {
    // Resize for Gameplay
    if (map.level.length > 0) {
      canvas.width = map.level[0].length * TILE_SIZE;
      canvas.height = map.level.length * TILE_SIZE;
      resize();
    }

    // Create Players
    let p1;
    if (selectedClass === "archer") {
      p1 = new Archer(40, 100, TILE_SIZE, TILE_SIZE * 2);
    } else {
      p1 = new Mage(40, 100, TILE_SIZE, TILE_SIZE * 2);
    }

    const bot = new Bot(600, 100, TILE_SIZE, TILE_SIZE * 2);

    players = [p1, bot];
    turnIndex = 0;
    players[0].startTurn();

    // Start Game
    currentState = GAME_STATE.PLAYING;
  }, 2000);
}

function nextTurn() {
  players[turnIndex].endTurn();
  turnIndex = (turnIndex + 1) % players.length;
  players[turnIndex].startTurn();
}

function checkWinCondition() {
  const p1 = players[0];
  const bot = players[1];

  if (p1.health <= 0) {
    // Player Died -> Game Over Screen
    currentState = GAME_STATE.GAME_OVER;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resize();
  } else if (bot.health <= 0) {
    // Bot Died -> Next Level
    if (currentLevel < 2) {
      currentLevel++;
      loadLevel(currentLevel);
    } else {
      // Victory -> Victory Screen
      currentState = GAME_STATE.VICTORY;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      resize();
    }
  }
}

function drawMenu() {
  ctx.save();
  // Fill background
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = "white";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CHOOSE YOUR CLASS", canvas.width / 2, 100);

  // Calculate Button Dimensions
  const btnSize = 250;
  const gap = 50;
  const totalWidth = btnSize * 2 + gap;
  const startX = (canvas.width - totalWidth) / 2;
  const startY = (canvas.height - btnSize) / 2;

  // Store coordinates for click detection
  menuButtons = {
    archer: { x: startX, y: startY, w: btnSize, h: btnSize },
    mage: { x: startX + btnSize + gap, y: startY, w: btnSize, h: btnSize },
  };

  // Draw Archer Button
  ctx.fillStyle = "#2ecc71"; // Green
  ctx.fillRect(
    menuButtons.archer.x,
    menuButtons.archer.y,
    menuButtons.archer.w,
    menuButtons.archer.h,
  );

  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.fillText(
    "ARCHER",
    menuButtons.archer.x + btnSize / 2,
    menuButtons.archer.y + btnSize / 2 - 20,
  );
  ctx.font = "16px Arial";
  ctx.fillText(
    "High Range",
    menuButtons.archer.x + btnSize / 2,
    menuButtons.archer.y + btnSize / 2 + 10,
  );
  ctx.fillText(
    "Gravity Arrows",
    menuButtons.archer.x + btnSize / 2,
    menuButtons.archer.y + btnSize / 2 + 30,
  );

  // Draw Mage Button
  ctx.fillStyle = "#e74c3c"; // Red
  ctx.fillRect(
    menuButtons.mage.x,
    menuButtons.mage.y,
    menuButtons.mage.w,
    menuButtons.mage.h,
  );

  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.fillText(
    "MAGE",
    menuButtons.mage.x + btnSize / 2,
    menuButtons.mage.y + btnSize / 2 - 20,
  );
  ctx.font = "16px Arial";
  ctx.fillText(
    "High Damage",
    menuButtons.mage.x + btnSize / 2,
    menuButtons.mage.y + btnSize / 2 + 10,
  );
  ctx.fillText(
    "Fireballs",
    menuButtons.mage.x + btnSize / 2,
    menuButtons.mage.y + btnSize / 2 + 30,
  );

  // Draw hover effect (optional, simplified)
  ctx.strokeStyle = "white";
  ctx.lineWidth = 4;
  ctx.strokeRect(menuButtons.archer.x, menuButtons.archer.y, btnSize, btnSize);
  ctx.strokeRect(menuButtons.mage.x, menuButtons.mage.y, btnSize, btnSize);
  ctx.restore();
}

function drawGameOver() {
  ctx.save();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "red";
  ctx.font = "bold 60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2 - 50);

  // Retry Button
  const btnW = 200;
  const btnH = 60;
  const btnX = (canvas.width - btnW) / 2;
  const btnY = canvas.height / 2 + 50;

  gameOverButton = { x: btnX, y: btnY, w: btnW, h: btnH };

  ctx.fillStyle = "#333";
  ctx.fillRect(btnX, btnY, btnW, btnH);

  ctx.strokeStyle = "white";
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle = "white";
  ctx.font = "bold 30px Arial";
  ctx.fillText("MENU", btnX + btnW / 2, btnY + btnH / 2 + 10);
  ctx.restore();
}

function drawVictory() {
  ctx.save();
  ctx.fillStyle = "navy";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "gold";
  ctx.font = "bold 60px Arial";
  ctx.textAlign = "center";
  ctx.fillText("VICTORY!", canvas.width / 2, canvas.height / 2 - 50);

  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText("You defeated the bots.", canvas.width / 2, canvas.height / 2);

  // New Game Button
  const btnW = 220;
  const btnH = 60;
  const btnX = (canvas.width - btnW) / 2;
  const btnY = canvas.height / 2 + 80;

  victoryButton = { x: btnX, y: btnY, w: btnW, h: btnH };

  ctx.fillStyle = "#333";
  ctx.fillRect(btnX, btnY, btnW, btnH);

  ctx.strokeStyle = "gold";
  ctx.strokeRect(btnX, btnY, btnW, btnH);

  ctx.fillStyle = "white";
  ctx.font = "bold 30px Arial";
  ctx.fillText("NEW GAME", btnX + btnW / 2, btnY + btnH / 2 + 10);
  ctx.restore();
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (currentState === GAME_STATE.MENU) {
    drawMenu();
  } else if (currentState === GAME_STATE.LEVEL_TRANSITION) {
    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`LEVEL ${currentLevel}`, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  } else if (currentState === GAME_STATE.GAME_OVER) {
    drawGameOver();
  } else if (currentState === GAME_STATE.VICTORY) {
    drawVictory();
  } else if (currentState === GAME_STATE.PLAYING) {
    // Draw Map
    map.draw(ctx);

    const currentPlayer = players[turnIndex];

    if (currentPlayer instanceof Bot) {
      const turnEnded = currentPlayer.updateBotLogic(map, players);
      currentPlayer.move({}, map, players);
      if (turnEnded) nextTurn();
    } else {
      currentPlayer.move(keys, map, players);
      if (currentPlayer.hasFired) {
        nextTurn();
      }
    }

    players.forEach((p) => {
      if (p !== currentPlayer) {
        p.updateProjectiles(map, players);
      }
    });

    players.forEach((p) => p.draw(ctx));

    ctx.save();
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Level ${currentLevel}`, 10, 30);
    ctx.restore();

    checkWinCondition();
  }

  requestAnimationFrame(gameLoop);
}

window.onload = init;
