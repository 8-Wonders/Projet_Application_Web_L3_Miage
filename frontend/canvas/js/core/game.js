import { AssetLoader } from "../../../common/assetLoader.js";
import { keys, handleInput } from "../input.js";
import { UIManager } from "./ui_manager.js";
import { LevelManager } from "./level_manager.js";
import { TurnManager, WIN_STATE } from "./turn_manager.js";
import { Bot } from "../players/bot.js";
import { LEVEL_CONFIG } from "./levels.js"; 

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
    
    // Modules
    this.loader = new AssetLoader();
    this.ui = new UIManager(this.canvas, this.ctx);
    this.levelManager = new LevelManager(this.loader, this.tileSize);
    this.turnManager = new TurnManager();

    // State
    this.currentState = GAME_STATE.MENU;
    this.currentLevelIdx = 1; // Corresponds to ID in config
    this.players = [];
    this.map = null;
    
    // Timing
    this.startTime = 0;
    this.accumulatedTime = 0;

    this.loop = this.loop.bind(this);
  }

  async init() {
    this._loadAssets();
    await this.loader.loadAll();
    
    this.setupInputs();
    this.setupResize();
    
    this.resize();
    this.loop();
  }

  _loadAssets() {
    const assets = [
      "assets/grass.png", "assets/brick.png", 
      "assets/water.png", "assets/stone.png"
    ];
    assets.forEach((path, idx) => this.loader.addImage(idx, path));
  }

  setupResize() {
    window.addEventListener("resize", () => {
      this.resize(this.currentState !== GAME_STATE.PLAYING);
    });
  }

  resize(fullscreen = true) {
    if (fullscreen) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    } else if (this.map) {
      // Fit canvas to map size, preserving aspect/max-size
      const mapW = this.map.level[0].length * this.tileSize;
      const mapH = this.map.level.length * this.tileSize;
      
      // Visual scaling (CSS)
      const scale = Math.min(
        (window.innerWidth - 4) / mapW, 
        (window.innerHeight - 4) / mapH
      );
      this.canvas.style.width = `${mapW * scale}px`;
      this.canvas.style.height = `${mapH * scale}px`;
      
      // Logic resolution
      this.canvas.width = mapW;
      this.canvas.height = mapH;
    }
    this.ui.resize(this.canvas.width, this.canvas.height);
  }

  setupInputs() {
    // Mouse Interaction
    this.canvas.addEventListener("click", (e) => this.handleMouseClick(e));

    // Player Control
    handleInput(() => {
      if (this.currentState === GAME_STATE.PLAYING) {
        return this.turnManager.getCurrentPlayer(this.players);
      }
      return null;
    });

    // Dev Tools / Cheats
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "k" && this.currentState === GAME_STATE.PLAYING) {
        console.log("Cheat: Skipping Level");
        this.advanceLevel();
      }
    });
  }

  handleMouseClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    switch (this.currentState) {
      case GAME_STATE.MENU:
        const choice = this.ui.checkMenuClick(mx, my);
        if (choice) this.startGame(choice);
        break;
      case GAME_STATE.GAME_OVER:
      case GAME_STATE.VICTORY:
        if (this.ui.checkRestartClick(mx, my)) { // Unified restart check
          this.currentState = GAME_STATE.MENU;
          this.resize(true);
        }
        break;
    }
  }

  async startGame(playerClass) {
    this.selectedClass = playerClass;
    this.currentLevelIdx = 1;
    this.accumulatedTime = 0;
    await this.startLevel(this.currentLevelIdx);
  }

  async startLevel(levelNum) {
    this.currentState = GAME_STATE.LEVEL_TRANSITION;
    this.resize(true);
    
    // 1. Load Map
    this.map = await this.levelManager.loadLevelMap(levelNum);
    
    // 2. Transition Delay
    setTimeout(() => {
      this.resize(false);
      this.players = this.levelManager.createEntities(levelNum, this.selectedClass);
      
      this.turnManager.reset();
      // Ensure first player starts their turn
      if(this.players.length > 0) this.players[0].startTurn(); 
      
      this.startTime = Date.now();
      this.currentState = GAME_STATE.PLAYING;
    }, 2000);
  }

  update() {
    if (this.currentState !== GAME_STATE.PLAYING) return;

    const currentPlayer = this.turnManager.getCurrentPlayer(this.players);
    if (!currentPlayer) return;

    // --- 1. Current Player Logic ---
    if (currentPlayer.health > 0) {
      if (currentPlayer instanceof Bot) {
        // Bot Logic
        const turnEnded = currentPlayer.updateBotLogic(this.map, this.players);
        currentPlayer.move({}, this.map, this.players);
        if (turnEnded) this.turnManager.nextTurn(this.players);
      } else {
        // Human Logic
        currentPlayer.move(keys, this.map, this.players);
        if (currentPlayer.hasFired) {
          this.turnManager.nextTurn(this.players);
        }
      }
    } else {
      // If current player is dead, skip immediately
      this.turnManager.nextTurn(this.players);
    }

    // --- 2. World Physics (Projectiles, Gravity for inactive) ---
    this.players.forEach(p => {
      if (p !== currentPlayer) {
        p.updateProjectiles(this.map, this.players);
        if (!p.grounded || Math.abs(p.vx) > 0.1) {
          p.move({}, this.map, this.players);
        }
      }
    });

    // --- 3. Check Game Status ---
    const status = this.turnManager.checkGameState(this.players);
    if (status === WIN_STATE.PLAYER_DIED) {
      this.currentState = GAME_STATE.GAME_OVER;
      this.resize(true);
    } else if (status === WIN_STATE.VICTORY) {
      this.advanceLevel();
    }
  }

  advanceLevel() {
    const currentLevelTime = Math.floor((Date.now() - this.startTime) / 1000);
    this.accumulatedTime += currentLevelTime;

    if (this.currentLevelIdx < LEVEL_CONFIG.length) {
      this.currentLevelIdx++;
      this.startLevel(this.currentLevelIdx);
    } else {
      this.currentState = GAME_STATE.VICTORY;
      this.resize(true);
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate Time
    const currentSession = this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const totalTime = this.accumulatedTime + (this.currentState === GAME_STATE.PLAYING ? currentSession : 0);

    // Render based on state
    if (this.currentState === GAME_STATE.PLAYING) {
      if (this.map) this.map.draw(this.ctx);
      // Draw dead players in background? If not, filter them:
      this.players.forEach(p => { if (p.health > 0) p.draw(this.ctx); });
      this.ui.drawHUD(this.currentLevelIdx, totalTime);
    } 
    else if (this.currentState === GAME_STATE.MENU) this.ui.drawMenu();
    else if (this.currentState === GAME_STATE.LEVEL_TRANSITION) this.ui.drawTransition(this.currentLevelIdx);
    else if (this.currentState === GAME_STATE.GAME_OVER) this.ui.drawGameOver();
    else if (this.currentState === GAME_STATE.VICTORY) this.ui.drawVictory();
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }
}
