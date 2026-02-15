export class UIManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Canvas Hitboxes (Legacy)
    this.gameOverButton = {};
    
    // We do NOT cache DOM elements here anymore to prevent null errors.
    // We look them up dynamically when needed.
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  // ==========================================
  //            DOM INTERACTION
  // ==========================================

  toggleMenuScreen(show) {
    const overlay = document.getElementById("menu-overlay");
    if (overlay) {
        if (show) overlay.classList.remove("hidden");
        else overlay.classList.add("hidden");
    }
  }

  bindMenuActions(onStartGame) {
    // Fetch elements NOW, when we are sure they exist
    const btnArcher = document.getElementById("btn-archer");
    const btnMage = document.getElementById("btn-mage");

    if (btnArcher) {
        btnArcher.onclick = () => {
            console.log("Archer selected"); // Debug log
            onStartGame("archer");
        };
    } else {
        console.error("Error: Archer button not found in DOM");
    }

    if (btnMage) {
        btnMage.onclick = () => {
            console.log("Mage selected"); // Debug log
            onStartGame("mage");
        };
    } else {
        console.error("Error: Mage button not found in DOM");
    }
  }

  bindSubmitAction(callback) {
    const submitBtn = document.getElementById("submit-btn");
    const usernameInput = document.getElementById("username-input");

    if (submitBtn) {
        submitBtn.onclick = () => { // Changed from addEventListener to onclick to prevent duplicates
            const name = usernameInput ? usernameInput.value.trim() : "";
            callback(name);
        };
    }
  }

  updateStatusMessage(msg, color = "#ccc") {
    const el = document.getElementById("status-message");
    if (el) {
        el.textContent = msg;
        el.style.color = color;
    }
  }

  clearInput() {
    const input = document.getElementById("username-input");
    if (input) input.value = "";
    this.updateStatusMessage("");
  }

  toggleVictoryScreen(show, seconds = 0) {
    const overlay = document.getElementById("victory-overlay");
    const timeDisplay = document.getElementById("final-time-display");
    const input = document.getElementById("username-input");

    if (show) {
        const minutes = Math.floor(seconds / 60);
        const sec = seconds % 60;
        if (timeDisplay) {
            timeDisplay.textContent = `${minutes}:${sec < 10 ? "0" + sec : sec}`;
        }
        
        if (overlay) overlay.classList.remove("hidden");
        this.updateStatusMessage(""); 
        if (input) input.focus();

    } else {
        if (overlay) overlay.classList.add("hidden");
    }
  }

  // ==========================================
  //           CANVAS DRAWING METHODS
  // ==========================================

  drawMenu() {
    // HTML Overlay handles the menu now.
    // We just draw a black background on the canvas behind it.
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGameOver() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "red";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("YOU DIED", canvas.width / 2, canvas.height / 2 - 50);

    const btnW = 200, btnH = 60;
    const btnX = (canvas.width - btnW) / 2;
    const btnY = canvas.height / 2 + 50;
    this.gameOverButton = { x: btnX, y: btnY, w: btnW, h: btnH };

    this._drawGenericButton(btnX, btnY, btnW, btnH, "MENU", "#333", "white");
    ctx.restore();
  }

  drawVictory() {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 50, 0.85)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  drawTransition(level) {
    const { ctx, canvas } = this;
    ctx.save();
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`LEVEL ${level}`, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  }

  drawHUD(level, seconds = 0) {
    const levelDiv = document.getElementById("level-indicator");
    const timeDiv = document.getElementById("tmps");
    
    if (levelDiv) levelDiv.textContent = `Level: ${level}`;
    
    if (timeDiv) {
        const minutes = Math.floor(seconds / 60);
        const sec = seconds % 60;
        const displayTime = `${minutes}: ${sec < 10 ? "0" + sec : sec}`;
        timeDiv.textContent = `Temps : ${displayTime}`;
    }
  }

  drawLoadout(player) {
    if (!player || !player.abilities) return;

    const { ctx, canvas } = this;
    const boxSize = 50;
    const padding = 10;
    const startX = canvas.width - (boxSize * player.abilities.length) - (padding * (player.abilities.length + 1));
    const startY = 10;

    ctx.save();
    ctx.font = "bold 14px Arial";
    
    player.abilities.forEach((AbilityClass, index) => {
        const x = startX + (index * (boxSize + padding));
        const y = startY;

        if (index === player.abilityIndex) {
            ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
            ctx.strokeStyle = "gold";
            ctx.lineWidth = 3;
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.strokeStyle = "gray";
            ctx.lineWidth = 1;
        }

        ctx.fillRect(x, y, boxSize, boxSize);
        ctx.strokeRect(x, y, boxSize, boxSize);

        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.fillText(index + 1, x + 3, y + 15);

        if (AbilityClass.drawIcon) {
            AbilityClass.drawIcon(ctx, x + 10, y + 15, 30);
        } else {
            ctx.fillStyle = "white";
            ctx.font = "10px Arial";
            ctx.fillText("?", x + 20, y + 30);
        }
    });

    ctx.restore();
  }

  _drawGenericButton(x, y, w, h, text, color, strokeColor) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
    this.ctx.strokeStyle = strokeColor;
    this.ctx.strokeRect(x, y, w, h);
    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 30px Arial";
    this.ctx.fillText(text, x + w / 2, y + h / 2 + 10);
  }

  checkRestartClick(mouseX, mouseY) {
    if (this._isInside(mouseX, mouseY, this.gameOverButton)) return true;
    return false;
  }
  
  // No longer needed for menu, but kept for interface consistency
  checkMenuClick(mouseX, mouseY) { return null; }

  _isInside(x, y, btn) {
    return btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
  }
}
