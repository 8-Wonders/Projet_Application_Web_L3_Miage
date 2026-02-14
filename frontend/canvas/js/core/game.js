import { AssetLoader } from "../../../common/assetLoader.js";
import { keys, handleInput } from "../input.js";
import { UIManager } from "./ui_manager.js";
import { LevelManager } from "./level_manager.js";
import { TurnManager, WIN_STATE } from "./turn_manager.js";
import { Bot } from "../players/bot.js";
import { LEVEL_CONFIG } from "./levels.js"; 

/**
 * Enum for High-Level Game States.
 * Controls what is rendered and updated in the main loop.
 */
export const GAME_STATE = {
  MENU: 0,
  PLAYING: 1,
  LEVEL_TRANSITION: 2,
  GAME_OVER: 3,
  VICTORY: 4,
};

export class Game {
  constructor() {
    // --- Rendering Context ---
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.tileSize = 50;
    
    // --- Sub-Systems ---
    this.loader = new AssetLoader();
    this.ui = new UIManager(this.canvas, this.ctx);
    this.levelManager = new LevelManager(this.loader, this.tileSize);
    this.turnManager = new TurnManager();

    // --- Game Data ---
    this.currentState = GAME_STATE.MENU;
    this.currentLevelIdx = 1; // Matches 'id' in levels.js
    this.players = [];
    this.map = null;
    this.selectedClass = null; // 'archer' or 'mage'
    
    // --- Timing & Statistics ---
    this.startTime = 0;
    this.accumulatedTime = 0; // Time spent in previous levels

    // Bind loop to preserve 'this' context
    this.loop = this.loop.bind(this);
  }

  /**
   * Main Entry Point.
   * Loads assets, binds inputs, and starts the render loop.
   */
  async init() {
    this._queueAssets();
    await this.loader.loadAll();
    
    this.setupInputs();
    this.setupResizeHandlers();
    
    // Initial resize to fit window
    this.resize();
    this.loop();
  }

  _queueAssets() {
    const assets = [
      "assets/grass.png", "assets/brick.png", 
      "assets/water.png", "assets/stone.png"
    ];
    assets.forEach((path, idx) => this.loader.addImage(idx, path));
  }

  // ==========================================
  //               INPUT & EVENT HANDLERS
  // ==========================================

  setupResizeHandlers() {
    window.addEventListener("resize", () => {
      // If playing, we want to scale the canvas to the map.
      // If menu, we want full screen.
      this.resize(this.currentState !== GAME_STATE.PLAYING);
    });
  }

  /**
   * Resizes the canvas.
   * @param {boolean} fullscreen - If true, fills window. If false, fits to Map dimensions.
   */
  resize(fullscreen = true) {
    if (fullscreen) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    } else if (this.map) {
      // 1. Calculate required Map dimensions
      const mapW = this.map.level[0].length * this.tileSize;
      const mapH = this.map.level.length * this.tileSize;
      
      // 2. Calculate scale factor to fit within browser window (with padding)
      const scale = Math.min(
        (window.innerWidth - 4) / mapW, 
        (window.innerHeight - 4) / mapH
      );
      
      // 3. Apply CSS scaling for visuals, but keep internal resolution matching the map
      this.canvas.style.width = `${mapW * scale}px`;
      this.canvas.style.height = `${mapH * scale}px`;
      
      this.canvas.width = mapW;
      this.canvas.height = mapH;
    }
    // Update UI Manager so it knows new boundaries
    this.ui.resize(this.canvas.width, this.canvas.height);
  }

  setupInputs() {
    // 1. Mouse Clicks (Menu/UI interaction)
    this.canvas.addEventListener("click", (e) => this.handleMouseClick(e));

    // 2. Keyboard/Continuous Input (Player movement)
    handleInput(() => {
      if (this.currentState === GAME_STATE.PLAYING) {
        return this.turnManager.getCurrentPlayer(this.players);
      }
      return null;
    });

    // 3. Developer Cheats
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "k" && this.currentState === GAME_STATE.PLAYING) {
        console.log("DEV: Skipping Level");
        this.advanceLevel();
      }
    });
  }

  handleMouseClick(e) {
    // Convert screen coordinates to canvas coordinates (accounting for CSS scaling)
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
        // Use a unified UI check since both screens likely have a "Reset" button
        if (this.ui.checkRestartClick(mx, my)) { 
          this.returnToMenu();
        }
        break;
    }
  }

  // ==========================================
  //               GAME FLOW CONTROL
  // ==========================================

  async startGame(playerClass) {
    this.selectedClass = playerClass;
    this.currentLevelIdx = 1;
    this.accumulatedTime = 0;
    await this.startLevel(this.currentLevelIdx);
  }

  returnToMenu() {
    this.currentState = GAME_STATE.MENU;
    this.resize(true);
  }

  async startLevel(levelNum) {
    this.currentState = GAME_STATE.LEVEL_TRANSITION;
    this.resize(true); // Fullscreen for transition text
    
    // 1. Load Map Data
    this.map = await this.levelManager.loadLevelMap(levelNum);
    
    // 2. Artificial Delay (for transition effect)
    setTimeout(() => {
      this.resize(false); // Snap to map size
      
      // 3. Spawn Entities
      this.players = this.levelManager.createEntities(levelNum, this.selectedClass);
      
      // 4. Reset Turns
      this.turnManager.reset();
      if(this.players.length > 0) this.players[0].startTurn(); 
      
      this.startTime = Date.now();
      this.currentState = GAME_STATE.PLAYING;
    }, 2000);
  }

  advanceLevel() {
    // Save time spent on this level
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

  // ==========================================
  //               MAIN LOOP
  // ==========================================

  update() {
    if (this.currentState !== GAME_STATE.PLAYING) return;

    const currentPlayer = this.turnManager.getCurrentPlayer(this.players);
    if (!currentPlayer) return;

    // --- Phase 1: Active Player Logic ---
    // Only the current player processes input or AI logic
    if (currentPlayer.health > 0) {
      if (currentPlayer instanceof Bot) {
        const turnEnded = currentPlayer.updateBotLogic(this.map, this.players);
        currentPlayer.move({}, this.map, this.players); // Apply physics
        if (turnEnded) this.turnManager.nextTurn(this.players);
      } else {
        // Human Player
        currentPlayer.move(keys, this.map, this.players);
        if (currentPlayer.hasFired) {
          this.turnManager.nextTurn(this.players);
        }
      }
    } else {
      // Skip dead players immediately
      this.turnManager.nextTurn(this.players);
    }

    // --- Phase 2: Global Physics ---
    // Apply gravity and projectile updates to everyone else
    this.players.forEach(p => {
      if (p !== currentPlayer) {
        p.updateProjectiles(this.map, this.players);
        // Apply physics if airborne or moving fast (sliding)
        if (!p.grounded || Math.abs(p.vx) > 0.1) {
          p.move({}, this.map, this.players);
        }
      }
    });

    // --- Phase 3: Game Rules ---
    const status = this.turnManager.checkGameState(this.players);
    
    if (status === WIN_STATE.PLAYER_DIED) {
      this.currentState = GAME_STATE.GAME_OVER;
      this.resize(true);
    } else if (status === WIN_STATE.VICTORY) {
      this.advanceLevel();
    }
  }

  draw() {
    // Clear screen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Calculate elapsed time for HUD
    const currentSession = this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const totalTime = this.accumulatedTime + (this.currentState === GAME_STATE.PLAYING ? currentSession : 0);

    // State-based rendering
    switch (this.currentState) {
      case GAME_STATE.PLAYING:
        if (this.map) this.map.draw(this.ctx);
        // Draw living players
        this.players.forEach(p => { if (p.health > 0) p.draw(this.ctx); });
        this.ui.drawHUD(this.currentLevelIdx, totalTime);
        break;
      
      case GAME_STATE.MENU:
        this.ui.drawMenu();
        break;
      
      case GAME_STATE.LEVEL_TRANSITION:
        this.ui.drawTransition(this.currentLevelIdx);
        break;
      
      case GAME_STATE.GAME_OVER:
        this.ui.drawGameOver();
        break;
      
      case GAME_STATE.VICTORY:
        this.ui.drawVictory();
        break;
    }
  }

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }
}
