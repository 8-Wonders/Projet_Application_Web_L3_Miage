import { AssetLoader } from "../../../common/assetLoader.js";
import { keys, handleInput } from "../input.js";
import { UIManager } from "./ui_manager.js";
import { LevelManager } from "./level_manager.js";
import { TurnManager, WIN_STATE } from "./turn_manager.js";
import { Bot } from "../players/bot.js";

export const GAME_STATE = {
  MENU: 0,
  PLAYING: 1,
  LEVEL_TRANSITION: 2,
  GAME_OVER: 3,
  VICTORY: 4,
};

export class Game {
  constructor() {
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.tileSize = 50;
    
    // Core Modules
    this.loader = new AssetLoader();
    this.ui = new UIManager(this.canvas, this.ctx);
    this.levelManager = new LevelManager(this.loader, this.tileSize);
    this.turnManager = new TurnManager(this);

    // Game State Data
    this.currentState = GAME_STATE.MENU;
    this.currentLevel = 1;
    this.selectedClass = null;
    this.players = [];
    this.map = null;
    
    // Timer
    this.startTime = 0;
    this.gameTime = 0; // in seconds
    this.accumulatedTime = 0;

    // Bind loop
    this.loop = this.loop.bind(this);
  }

  async init() {
    // Load images
    this.loader.addImage(0, "assets/grass.png");
    this.loader.addImage(1, "assets/brick.png");
    this.loader.addImage(2, "assets/water.png");
    this.loader.addImage(3, "assets/stone.png");
    await this.loader.loadAll();

    // Setup Event Listeners
    this.setupInputs();
    this.setupResize();

    // Start
    this.resize();
    this.loop();
  }

  setupResize() {
    window.addEventListener("resize", () => {
        if (this.currentState !== GAME_STATE.PLAYING) {
            this.resize(true); // Fullscreen
        } else {
            this.resize(false); // Game screen
        }
    });
  }

  resize(fullscreen = true) {
    if (fullscreen) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    } else if (this.map && this.map.level.length > 0) {
      const windowWidth = window.innerWidth - 4;
      const windowHeight = window.innerHeight - 4;
      const cw = this.map.level[0].length * this.tileSize;
      const ch = this.map.level.length * this.tileSize;
      
      const scale = Math.min(windowWidth / cw, windowHeight / ch);
      this.canvas.style.width = `${cw * scale}px`;
      this.canvas.style.height = `${ch * scale}px`;
      
      // Actual canvas resolution remains high fidelity or matches tile count
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    this.ui.resize(this.canvas.width, this.canvas.height);
  }

  setupInputs() {
    // Mouse
    this.canvas.addEventListener("click", (e) => this.handleClick(e));

    // Keyboard (using existing input.js logic)
    handleInput(() => {
      if (this.currentState === GAME_STATE.PLAYING) {
        return this.turnManager.getCurrentPlayer();
      }
      return null;
    });

    // === CHEAT CODE: K to Skip to Level 3 ===
    window.addEventListener("keydown", (e) => {
        if ((e.key === "k" || e.key === "K") && this.currentState === GAME_STATE.PLAYING) {
            console.log("Cheat activated: Skipping to Level 3...");
            this.currentLevel = 3;
            this.startLevel(3);
        }
    });
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    if (this.currentState === GAME_STATE.MENU) {
      const choice = this.ui.checkMenuClick(mx, my);
      if (choice) this.startGame(choice);
    } 
    else if (this.currentState === GAME_STATE.GAME_OVER) {
      if (this.ui.checkGameOverClick(mx, my)) {
        this.currentState = GAME_STATE.MENU;
        this.resize(true);
      }
    } 
    else if (this.currentState === GAME_STATE.VICTORY) {
      if (this.ui.checkVictoryClick(mx, my)) {
        this.currentState = GAME_STATE.MENU;
        this.resize(true);
      }
    }
  }

  async startGame(playerClass) {
    this.selectedClass = playerClass;
    this.currentLevel = 1;
    this.accumulatedTime = 0;
    await this.startLevel(this.currentLevel);
  }

  async startLevel(levelNum) {
    this.currentState = GAME_STATE.LEVEL_TRANSITION;
    this.resize(true);
    
    // Load Map
    this.map = await this.levelManager.loadLevel(levelNum);

    // Wait briefly for transition
    setTimeout(() => {
        this.resize(false);
        this.players = this.levelManager.createEntities(levelNum, this.selectedClass);
        this.turnManager.reset();
        this.startTime = Date.now();
        this.currentState = GAME_STATE.PLAYING;
    }, 2000);
  }

  update() {
    if (this.currentState !== GAME_STATE.PLAYING) return;
    
    // Update Timer
    const currentLevelTime = Math.floor((Date.now() - this.startTime) / 1000);
    const totalTime = this.accumulatedTime + currentLevelTime;

    const currentPlayer = this.turnManager.getCurrentPlayer();

    // 1. Update Current Player
    if (currentPlayer && currentPlayer.health > 0) {
      if (currentPlayer instanceof Bot) {
        const turnEnded = currentPlayer.updateBotLogic(this.map, this.players);
        currentPlayer.move({}, this.map, this.players);
        if (turnEnded) this.turnManager.nextTurn();
      } else {
        // Human
        currentPlayer.move(keys, this.map, this.players);
        if (currentPlayer.hasFired) {
            this.turnManager.nextTurn();
        }
      }
    } 
    else if (currentPlayer && currentPlayer.health <= 0) {
      this.turnManager.nextTurn();
    }

    // 2. Update Physics/Projectiles for everyone else
    this.players.forEach(p => {
        if (p !== currentPlayer) {
            p.updateProjectiles(this.map, this.players);
            
            // Apply physics for inactive players (Knockback/Falling)
            if (!p.grounded || Math.abs(p.vx) > 0.1) {
                 p.move({}, this.map, this.players);
            }
        }
    });

    // 3. Check Win Condition
    const status = this.turnManager.checkWinStatus();
    if (status === WIN_STATE.PLAYER_DIED) {
        this.currentState = GAME_STATE.GAME_OVER;
        this.resize(true);
    } else if (status === WIN_STATE.ALL_BOTS_DEAD) {
        // === CHANGED: Allow level 3 ===
        if (this.currentLevel < 3) {
            this.accumulatedTime += currentLevelTime;
            this.currentLevel++;
            this.startLevel(this.currentLevel);
        } else {
            this.currentState = GAME_STATE.VICTORY;
            this.resize(true);
        }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const currentLevelTime = this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const totalTime = this.accumulatedTime + currentLevelTime;

    switch (this.currentState) {
      case GAME_STATE.MENU:
        this.ui.drawMenu();
        break;
      case GAME_STATE.LEVEL_TRANSITION:
        this.ui.drawTransition(this.currentLevel);
        break;
      case GAME_STATE.GAME_OVER:
        this.ui.drawGameOver();
        break;
      case GAME_STATE.VICTORY:
        this.ui.drawVictory();
        break;
      case GAME_STATE.PLAYING:
        if (this.map) this.map.draw(this.ctx);
        this.players.forEach(p => {
            if (p.health > 0) p.draw(this.ctx);
        });
        this.ui.drawHUD(this.currentLevel, totalTime);
        break;
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }
}
