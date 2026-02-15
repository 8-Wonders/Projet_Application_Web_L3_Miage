import { AssetLoader } from "../../../common/assetLoader.js";
import { keys, handleInput } from "../input.js";
import { UIManager } from "./ui_manager.js";
import { LevelManager } from "./level_manager.js";
import { TurnManager, WIN_STATE } from "./turn_manager.js";
import { Bot } from "../players/bot.js";
import { LEVEL_CONFIG } from "./levels.js"; 
import { ScoreService } from "../services/score.js"; // IMPORT SERVICE

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
    
    this.loader = new AssetLoader();
    this.ui = new UIManager(this.canvas, this.ctx);
    this.levelManager = new LevelManager(this.loader, this.tileSize);
    this.turnManager = new TurnManager();

    this.currentState = GAME_STATE.MENU;
    this.currentLevelIdx = 1; 
    this.players = [];
    this.map = null;
    this.selectedClass = null; 
    
    this.startTime = 0;
    this.accumulatedTime = 0; 

    this.loop = this.loop.bind(this);
    // Bind 'this' for the callback passed to UIManager
    this.submitScore = this.submitScore.bind(this);
  }

  async init() {
    this._queueAssets();
    await this.loader.loadAll();
    
    this.setupInputs();
    this.setupResizeHandlers();
    
    // Bind the UI button action to our game logic
    this.ui.bindSubmitAction(this.submitScore);
    
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

  setupResizeHandlers() {
    window.addEventListener("resize", () => {
      this.resize(this.currentState !== GAME_STATE.PLAYING);
    });
  }

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

  setupInputs() {
    // 1. Mouse Clicks (UI/Menu)
    this.canvas.addEventListener("click", (e) => this.handleMouseClick(e));

    // 2. Keyboard/Continuous Input
    handleInput(() => {
      if (this.currentState === GAME_STATE.PLAYING) {
        return this.turnManager.getCurrentPlayer(this.players);
      }
      return null;
    }, this.canvas);

    // 3. Developer Cheats
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "k" && this.currentState === GAME_STATE.PLAYING) {
        console.log("DEV: Skipping Level");
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
        if (this.ui.checkRestartClick(mx, my)) { 
          this.returnToMenu();
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

  returnToMenu() {
    this.currentState = GAME_STATE.MENU;
    this.ui.toggleVictoryScreen(false); 
    this.resize(true);
  }

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

  advanceLevel() {
    const currentLevelTime = Math.floor((Date.now() - this.startTime) / 1000);
    this.accumulatedTime += currentLevelTime;

    if (this.currentLevelIdx < LEVEL_CONFIG.length) {
      this.currentLevelIdx++;
      this.startLevel(this.currentLevelIdx);
    } else {
      // VICTORY STATE
      this.currentState = GAME_STATE.VICTORY;
      this.resize(true);
      
      this.ui.toggleVictoryScreen(true, this.accumulatedTime);
    }
  }

  // Refactored Submit Logic using ScoreService
  async submitScore(username) {
    if (!username) {
        this.ui.updateStatusMessage("Please enter a username!", "red");
        return;
    }

    this.ui.updateStatusMessage("Sending...", "#ccc");

    // Call the independent service
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

  update() {
    if (this.currentState !== GAME_STATE.PLAYING) return;

    const currentPlayer = this.turnManager.getCurrentPlayer(this.players);
    if (!currentPlayer) return;

    if (currentPlayer.health > 0) {
      if (currentPlayer instanceof Bot) {
        const turnEnded = currentPlayer.updateBotLogic(this.map, this.players);
        currentPlayer.move({}, this.map, this.players); 
        if (turnEnded) this.turnManager.nextTurn(this.players);
      } else {
        // Human Player
        currentPlayer.move(keys, this.map, this.players);
        if (currentPlayer.hasFired) {
          this.turnManager.nextTurn(this.players);
        }
      }
    } else {
      this.turnManager.nextTurn(this.players);
    }

    this.players.forEach(p => {
      if (p !== currentPlayer) {
        p.updateProjectiles(this.map, this.players);
        if (!p.grounded || Math.abs(p.vx) > 0.1) {
          p.move({}, this.map, this.players);
        }
      }
    });

    const status = this.turnManager.checkGameState(this.players);
    
    if (status === WIN_STATE.PLAYER_DIED) {
      this.currentState = GAME_STATE.GAME_OVER;
      this.resize(true);
    } else if (status === WIN_STATE.VICTORY) {
      this.advanceLevel();
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const currentSession = this.startTime > 0 ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
    const totalTime = this.accumulatedTime + (this.currentState === GAME_STATE.PLAYING ? currentSession : 0);

    switch (this.currentState) {
      case GAME_STATE.PLAYING:
        if (this.map) this.map.draw(this.ctx);
        this.players.forEach(p => { if (p.health > 0) p.draw(this.ctx); });
        
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

  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  }
}
