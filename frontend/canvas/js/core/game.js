/**
 * @module game
 * @description The core engine orchestrator. Manages the global state machine, asset initialization, 
 * timing accumulation, and the primary RequestAnimationFrame loop. Bridges DOM UI interactions 
 * with the underlying Canvas rendering and physics pipelines.
 */

import { AssetLoader } from "../../../common/assetLoader.js";
import { keys, handleInput } from "../input.js";
import { UIManager } from "./ui_manager.js";
import { LevelManager } from "./level_manager.js";
import { TurnManager, WIN_STATE } from "./turn_manager.js";
import { Bot } from "../players/bot.js";
import { LEVEL_CONFIG } from "./levels.js"; 
import { ScoreService } from "../services/score.js"; 

/**
 * @enum {number}
 * @description Strict enumeration of global engine states to control update/render pathing.
 */
export const GAME_STATE = {
  MENU: 0,
  PLAYING: 1,
  LEVEL_TRANSITION: 2,
  GAME_OVER: 3,
  VICTORY: 4,
};

/**
 * Primary Game Controller.
 * Binds all subsystems (UI, Map, Entities, Turn Management) and executes the main game loop.
 */
export class Game {
  constructor() {
    this.canvas = document.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.tileSize = 50;
    
    // Subsystem Instantiation
    this.loader = new AssetLoader();
    this.ui = new UIManager(this.canvas, this.ctx);
    this.levelManager = new LevelManager(this.loader, this.tileSize);
    this.turnManager = new TurnManager();

    // Engine State
    this.currentState = GAME_STATE.MENU;
    this.currentLevelIdx = 1; 
    this.players = [];
    this.map = null;
    this.selectedClass = null; 
    
    // Telemetry & Scoring
    this.startTime = 0;
    this.accumulatedTime = 0; 

    // Context binding for callbacks and asynchronous handlers
    this.loop = this.loop.bind(this);
    this.submitScore = this.submitScore.bind(this);
    this.startGame = this.startGame.bind(this);
  }

  /**
   * Bootstraps the engine. Queues assets, awaits network resolution, 
   * binds event listeners, and kickstarts the render loop.
   * * @async
   * @returns {Promise<void>}
   */
  async init() {
    this._queueAssets();
    await this.loader.loadAll();
    
    this.setupInputs();
    this.setupResizeHandlers();
    
    // Bind HTML Actions
    this.ui.bindSubmitAction(this.submitScore);
    this.ui.bindMenuActions(this.startGame);
    
    // Ensure Menu is Visible
    this.ui.toggleMenuScreen(true);
    
    this.resize();
    this.loop();
  }

  /**
   * Registers required graphical assets into the loader's queue before resolution.
   * @private
   */
  _queueAssets() {
    const assets = [
	  "assets/png/grass.png", // ID 0
      "assets/png/brick.png", // ID 1
      "assets/png/water.png", // ID 2
      "assets/png/stone.png"  // ID 3
    ];
    assets.forEach((path, idx) => this.loader.addImage(idx, path));

	this.loader.addImage("archer_0", "assets/png/archer_0.png");
    this.loader.addImage("archer_1", "assets/png/archer_1.png");
    this.loader.addImage("mage_0", "assets/png/mage_0.png");
    this.loader.addImage("mage_1", "assets/png/mage_1.png");
    this.loader.addImage("goblin_0", "assets/png/goblin_0.png");
    this.loader.addImage("goblin_1", "assets/png/goblin_1.png");
    this.loader.addImage("dragon_0", "assets/png/dragon_0.png");
    this.loader.addImage("dragon_1", "assets/png/dragon_1.png");
  }

  /**
   * Subscribes to window dimension changes to maintain canvas aspect ratios and bounding boxes.
   */
  setupResizeHandlers() {
    window.addEventListener("resize", () => {
      this.resize(this.currentState !== GAME_STATE.PLAYING);
    });
  }

  /**
   * Dynamically adjusts the canvas resolution and viewport CSS scaling.
   * @param {boolean} [fullscreen=true] - If true, spans the entire viewport. If false, scales to map bounds.
   */
  resize(fullscreen = true) {
    if (fullscreen) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    } else if (this.map) {
      const mapW = this.map.level[0].length * this.tileSize;
      const mapH = this.map.level.length * this.tileSize;
      
      const scale = Math.min(
        (window.innerWidth - 4) / mapW, 
        (window.innerHeight - 4) / mapH
      );
      
      this.canvas.style.width = `${mapW * scale}px`;
      this.canvas.style.height = `${mapH * scale}px`;
      
      this.canvas.width = mapW;
      this.canvas.height = mapH;
    }
    this.ui.resize(this.canvas.width, this.canvas.height);
  }

  /**
   * Binds global I/O interceptors for mouse and keyboard.
   * Delegates specific input processing to the currently active entity during the PLAYING state.
   */
  setupInputs() {
    this.canvas.addEventListener("click", (e) => this.handleMouseClick(e));
    
    handleInput(() => {
      if (this.currentState === GAME_STATE.PLAYING) {
        return this.turnManager.getCurrentPlayer(this.players);
      }
      return null;
    }, this.canvas);

    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "k" && this.currentState === GAME_STATE.PLAYING) {
        console.log("DEV: Skipping Level");
        this.advanceLevel();
      }
    });
  }

  /**
   * Translates viewport mouse coordinates to internal canvas space and delegates interaction logic.
   * @param {MouseEvent} e - The native browser click event.
   */
  handleMouseClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    switch (this.currentState) {
      case GAME_STATE.GAME_OVER:
        if (this.ui.checkRestartClick(mx, my)) { 
          this.returnToMenu();
        }
        break;
    }
  }

  /**
   * Initializes a new session sequence, resetting global timers and caching the chosen class.
   * @param {string} playerClass - The logical identifier for the user's chosen avatar (e.g., "mage").
   */
  async startGame(playerClass) {
    console.log("Starting Game with class:", playerClass);
    
    // Hide HTML Menu
    this.ui.toggleMenuScreen(false);

    this.selectedClass = playerClass;
    this.currentLevelIdx = 1;
    this.accumulatedTime = 0;
    await this.startLevel(this.currentLevelIdx);
  }

  /**
   * Reverts the engine to a baseline idle state, exposing the main HTML DOM menu.
   */
  returnToMenu() {
    this.currentState = GAME_STATE.MENU;
    this.ui.toggleVictoryScreen(false); 
    this.ui.toggleMenuScreen(true); // Show Menu Again
    this.resize(true);
  }

  /**
   * Tears down previous level state and asynchronously builds the requested topology and entity registry.
   * Initiates a forced transition delay for UX pacing.
   * * @param {number} levelNum - The integer identifier from LEVEL_CONFIG.
   */
  async startLevel(levelNum) {
    this.currentState = GAME_STATE.LEVEL_TRANSITION;
    this.resize(true); 
    
    this.map = await this.levelManager.loadLevelMap(levelNum);
    
    setTimeout(() => {
      this.resize(false); 
      
      this.players = this.levelManager.createEntities(levelNum, this.selectedClass);
      
      this.turnManager.reset();
      if(this.players.length > 0) this.players[0].startTurn(); 
      
      this.startTime = Date.now();
      this.currentState = GAME_STATE.PLAYING;
    }, 2000);
  }

  /**
   * Evaluates progression. Either transitions to the next map or finalizes the session 
   * into a victory state, halting gameplay telemetry.
   */
  advanceLevel() {
    const currentLevelTime = Math.floor((Date.now() - this.startTime) / 1000);
    this.accumulatedTime += currentLevelTime;

    if (this.currentLevelIdx < LEVEL_CONFIG.length) {
      this.currentLevelIdx++;
      this.startLevel(this.currentLevelIdx);
    } else {
      this.currentState = GAME_STATE.VICTORY;
      this.resize(true);
      this.ui.toggleVictoryScreen(true, this.accumulatedTime);
    }
  }

  /**
   * Dispatches the finalized accumulated run time to the external backend service.
   * @param {string} username - The user-provided string identifier for the leaderboard.
   */
  async submitScore(username) {
    if (!username) {
        this.ui.updateStatusMessage("Please enter a username!", "red");
        return;
    }

    this.ui.updateStatusMessage("Sending...", "#ccc");
    const result = await ScoreService.submit(username, this.accumulatedTime);

    if (result.success) {
        console.log("Score saved!");
        this.ui.clearInput();
        this.returnToMenu();
    } else {
        console.error("Server Error:", result.error);
        this.ui.updateStatusMessage("Error saving score. Try again.", "red");
    }
  }

  /**
   * Primary logic pump. Processes physics steps, AI ticks, and turn evaluations 
   * exclusively during the PLAYING state.
   */
  update() {
    if (this.currentState !== GAME_STATE.PLAYING) return;

    const currentPlayer = this.turnManager.getCurrentPlayer(this.players);
    if (!currentPlayer) return;

    // Active Entity Processing
    if (currentPlayer.health > 0) {
      if (currentPlayer instanceof Bot) {
        // AI delegates directly to its strategy pattern
        const turnEnded = currentPlayer.updateBotLogic(this.map, this.players);
        currentPlayer.move({}, this.map, this.players); 
        if (turnEnded) this.turnManager.nextTurn(this.players);
      } else {
        // Human player evaluates keyboard inputs
        currentPlayer.move(keys, this.map, this.players);
        if (currentPlayer.hasFired) {
          this.turnManager.nextTurn(this.players);
        }
      }
    } else {
      // Pass turn immediately if the current entity died out-of-band (e.g. DoT effects)
      this.turnManager.nextTurn(this.players);
    }

    // Passive Entity Processing (Physics updates for objects/players not currently acting)
    this.players.forEach(p => {
      if (p !== currentPlayer) {
        p.updateProjectiles(this.map, this.players);
        // Force physics resolution if suspended mid-air or sliding
        if (!p.grounded || Math.abs(p.vx) > 0.1) {
          p.move({}, this.map, this.players);
        }
      }
    });

    // Check Win/Loss Matrix
    const status = this.turnManager.checkGameState(this.players);
    
    if (status === WIN_STATE.PLAYER_DIED) {
      this.currentState = GAME_STATE.GAME_OVER;
      this.resize(true);
    } else if (status === WIN_STATE.VICTORY) {
      this.advanceLevel();
    }
  }

  /**
   * Primary rendering pump. Dispatches draw calls to subsystems based on the current machine state.
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const currentSession = this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const totalTime = this.accumulatedTime + (this.currentState === GAME_STATE.PLAYING ? currentSession : 0);

    switch (this.currentState) {
      case GAME_STATE.PLAYING:
        if (this.map) this.map.draw(this.ctx);

		this.players.forEach(p => { 
            // Cull dead entities from the render pipeline
            if (p.health > 0) p.draw(this.ctx, this.loader); 
        });
        
        this.ui.drawHUD(this.currentLevelIdx, totalTime);
        
        const activePlayer = this.turnManager.getCurrentPlayer(this.players);
        if (activePlayer && !(activePlayer instanceof Bot)) {
            this.ui.drawLoadout(activePlayer);
        }
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

  /**
   * Standard browser animation loop wrapper. Maintains engine tick relative to screen refresh rate.
   */
  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }
}
