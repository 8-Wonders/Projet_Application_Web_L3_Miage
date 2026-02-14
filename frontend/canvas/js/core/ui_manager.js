export class UIManager {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    
    // Hitboxes for clickable UI elements
    this.menuButtons = {};
    this.gameOverButton = {};
    this.victoryButton = {};
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  // ==========================================
  //               DRAWING METHODS
  // ==========================================

  drawMenu() {
    const { ctx, canvas } = this;
    ctx.save();
    
    // Background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = "white";
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CHOOSE YOUR CLASS", canvas.width / 2, 100);

    // Button Layout Calculation
    const btnSize = 250;
    const gap = 50;
    const totalWidth = btnSize * 2 + gap;
    // Center the button group horizontally and vertically
    const startX = (canvas.width - totalWidth) / 2;
    const startY = (canvas.height - btnSize) / 2;

    // Define hitboxes
    this.menuButtons = {
      archer: { x: startX, y: startY, w: btnSize, h: btnSize },
      mage: { x: startX + btnSize + gap, y: startY, w: btnSize, h: btnSize },
    };

    // Draw Buttons
    this._drawClassButton("archer", "#2ecc71", "ARCHER", "High Range", "Gravity Arrows");
    this._drawClassButton("mage", "#e74c3c", "MAGE", "High Damage", "Fireballs");

    ctx.restore();
  }

  _drawClassButton(key, color, label, desc1, desc2) {
    const btn = this.menuButtons[key];
    const { ctx } = this;
    const btnSize = btn.w;

    // Background
    ctx.fillStyle = color;
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    
    // Text
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.fillText(label, btn.x + btnSize / 2, btn.y + btnSize / 2 - 20);
    ctx.font = "16px Arial";
    ctx.fillText(desc1, btn.x + btnSize / 2, btn.y + btnSize / 2 + 10);
    ctx.fillText(desc2, btn.x + btnSize / 2, btn.y + btnSize / 2 + 30);
    
    // Border
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

    // Define Button
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
    ctx.fillStyle = "navy";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "gold";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("VICTORY!", canvas.width / 2, canvas.height / 2 - 50);

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText("You defeated the bots.", canvas.width / 2, canvas.height / 2);

    // Define Button
    const btnW = 220, btnH = 60;
    const btnX = (canvas.width - btnW) / 2;
    const btnY = canvas.height / 2 + 80;
    this.victoryButton = { x: btnX, y: btnY, w: btnW, h: btnH };

    this._drawGenericButton(btnX, btnY, btnW, btnH, "NEW GAME", "#333", "gold");
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

  /**
   * Updates HTML DOM elements for HUD.
   * NOTE: Relies on existence of 'level-indicator' and 'tmps' IDs in HTML.
   */
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

  // Unified check for both Game Over and Victory screens
  checkRestartClick(mouseX, mouseY) {
    if (this._isInside(mouseX, mouseY, this.gameOverButton)) return true;
    if (this._isInside(mouseX, mouseY, this.victoryButton)) return true;
    return false;
  }

  /**
   * AABB Collision check for Mouse vs Button
   */
  _isInside(x, y, btn) {
    return btn && x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h;
  }
}
