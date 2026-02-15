export class UIManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Canvas Hitboxes
    this.menuButtons = {};
    this.gameOverButton = {};
    
    // DOM Elements (Cached)
    this.victoryOverlay = document.getElementById("victory-overlay");
    this.finalTimeDisplay = document.getElementById("final-time-display");
    this.statusMessage = document.getElementById("status-message");
    this.usernameInput = document.getElementById("username-input");
    this.submitBtn = document.getElementById("submit-btn");
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  // ==========================================
  //            DOM INTERACTION
  // ==========================================

  /**
   * Binds a callback function to the HTML Submit button.
   * @param {Function} callback - Function to call with the username string.
   */
  bindSubmitAction(callback) {
    if (this.submitBtn) {
        // We wrap the callback to extract the value here in the UI layer
        this.submitBtn.addEventListener("click", () => {
            const name = this.usernameInput ? this.usernameInput.value.trim() : "";
            callback(name);
        });
    }
  }

  updateStatusMessage(msg, color = "#ccc") {
    if (this.statusMessage) {
        this.statusMessage.textContent = msg;
        this.statusMessage.style.color = color;
    }
  }

  clearInput() {
    if (this.usernameInput) this.usernameInput.value = "";
    this.updateStatusMessage("");
  }

  toggleVictoryScreen(show, seconds = 0) {
    if (show) {
        const minutes = Math.floor(seconds / 60);
        const sec = seconds % 60;
        if (this.finalTimeDisplay) {
            this.finalTimeDisplay.textContent = `${minutes}:${sec < 10 ? "0" + sec : sec}`;
        }
        
        this.victoryOverlay.classList.remove("hidden");
        this.updateStatusMessage(""); 
        if (this.usernameInput) this.usernameInput.focus();

    } else {
        this.victoryOverlay.classList.add("hidden");
    }
  }

  // ==========================================
  //           CANVAS DRAWING METHODS
  // ==========================================

  drawMenu() {
    const { ctx, canvas } = this;
    ctx.save();
    
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CHOOSE YOUR CLASS", canvas.width / 2, 100);

    const btnSize = 250;
    const gap = 50;
    const totalWidth = btnSize * 2 + gap;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = (canvas.height - btnSize) / 2;

    this.menuButtons = {
      archer: { x: startX, y: startY, w: btnSize, h: btnSize },
      mage: { x: startX + btnSize + gap, y: startY, w: btnSize, h: btnSize },
    };

    this._drawClassButton("archer", "#2ecc71", "ARCHER", "High Range", "Gravity Arrows");
    this._drawClassButton("mage", "#e74c3c", "MAGE", "High Damage", "Fireballs");

    ctx.restore();
  }

  _drawClassButton(key, color, label, desc1, desc2) {
    const btn = this.menuButtons[key];
    const { ctx } = this;
    const btnSize = btn.w;

    ctx.fillStyle = color;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.fillText(label, btn.x + btnSize / 2, btn.y + btnSize / 2 - 20);
    ctx.font = "16px Arial";
    ctx.fillText(desc1, btn.x + btnSize / 2, btn.y + btnSize / 2 + 10);
    ctx.fillText(desc2, btn.x + btnSize / 2, btn.y + btnSize / 2 + 30);
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.strokeRect(btn.x, btn.y, btnSize, btnSize);
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
    // Darken background
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

  // ==========================================
  //               INPUT HELPERS
  // ==========================================

  checkMenuClick(mouseX, mouseY) {
    if (this._isInside(mouseX, mouseY, this.menuButtons.archer)) return "archer";
    if (this._isInside(mouseX, mouseY, this.menuButtons.mage)) return "mage";
    return null;
  }

  checkRestartClick(mouseX, mouseY) {
    if (this._isInside(mouseX, mouseY, this.gameOverButton)) return true;
    return false;
  }

  _isInside(x, y, btn) {
    return btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
  }
}
