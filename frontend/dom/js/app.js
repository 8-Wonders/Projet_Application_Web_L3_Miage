import { GBScreen } from "./gb/screen.js";
import { ImageViewerGame } from "./games/image_viewer.js";
import { SnakeGame } from "./games/snake.js";

export class GBApp {
  constructor() {
    this.display = document.getElementById("gb-display");
    this.imageInput = document.getElementById("gb-image");
    this.palette = [
      { r: 180, g: 222, b: 126, className: "cell-c1" },
      { r: 184, g: 171, b: 18, className: "cell-c2" },
      { r: 150, g: 82, b: 27, className: "cell-c3" },
      { r: 72, g: 36, b: 37, className: "cell-c4" },
    ];
    this.screen = new GBScreen({
      cols: 160,
      rows: 144,
      root: this.display,
      palette: this.palette,
    });
    this.mode = "menu";
    this.game = new SnakeGame(this.screen, {
      cellSize: 8,
      cellGap: 1,
      backgroundClass: "cell-c1",
      snakeClass: "cell-c4",
    });
    this.imageGame = new ImageViewerGame(this.screen, {
      titleFont: { fontFamily: "EarlyGameBoy, monospace", fontSize: 16 },
    });
    this.loopId = null;
    this.currentGame = "snake";
    this.prevMode = null;
    this.menuOptions = [
      { id: "snake", label: "SNAKE" },
      { id: "image", label: "IMAGE" },
    ];
    this.menuIndex = 0;
  }

  async init() {
    await this.loadFonts();
    this.appleSprite = await GBScreen.loadSprite("assets/apple.csv");
    this.snakeThumbSprite = await GBScreen.loadSprite("assets/snake_thumb.csv");
    this.imageThumbSprite = await GBScreen.loadSprite("assets/image_thumb.csv");
    this.snakeHeadSprite = await GBScreen.loadSprite("assets/snake_head.csv");
    this.snakeBodySprite = await GBScreen.loadSprite("assets/snake_body.csv");
    this.game.spawnFood(this.appleSprite);
    this.showMenu();
    this.startLoop();
    this.bindInput();
  }

  drawMenu() {
    this.screen.clear("cell-c1");
    this.screen.drawTextBitmap(16, 10, "GB DOM", "cell-c3", {
      fontFamily: "EarlyGameBoy, monospace",
      fontSize: 20,
    });
    const thumbY = 50;
    const spacing = 70;
    const startX = 20;
    for (let i = 0; i < this.menuOptions.length; i++) {
      const option = this.menuOptions[i];
      const x = startX + i * spacing;
      if (i === this.menuIndex) {
        this.screen.drawRect(x - 2, thumbY - 2, 44, 32, "cell-c4");
      }
      this.screen.drawRect(x, thumbY, 40, 28, "cell-c2");
      this.screen.drawRect(x + 2, thumbY + 2, 36, 24, "cell-c1");
      const labelX = x + 4;
      const labelY = thumbY + 32;
      this.screen.drawText(labelX, labelY, option.label, "cell-c3");
      if (option.id === "snake") {
        this.screen.drawSprite(x + 6, thumbY + 6, this.snakeThumbSprite);
      }
      if (option.id === "image") {
        this.screen.drawSprite(x + 4, thumbY + 4, this.imageThumbSprite);
      }
    }
    this.screen.drawText(16, 120, "ENTER TO PLAY", "cell-c3");
  }

  showMenu() {
    this.mode = "menu";
    this.drawMenu();
  }

  renderPauseMenu() {
    this.screen.clear("cell-c1");
    this.screen.drawTextBitmap(24, 20, "PAUSED", "cell-c3", {
      fontFamily: "EarlyGameBoy, monospace",
      fontSize: 18,
    });
    this.screen.drawText(20, 60, "PRESS C", "cell-c3");
    this.screen.drawText(20, 72, "TO CONTINUE", "cell-c3");
    this.screen.drawText(20, 84, "PRESS Q", "cell-c3");
    this.screen.drawText(20, 96, "FOR MENU", "cell-c3");
  }

  showPauseMenu() {
    this.prevMode = this.mode;
    this.mode = "pause";
    this.renderPauseMenu();
  }

  renderGameOverScreen() {
    this.screen.clear("cell-c1");
    this.screen.drawTextBitmap(10, 18, "GAME OVER", "cell-c3", {
      fontFamily: "EarlyGameBoy, monospace",
      fontSize: 18,
    });
    const startX = 12;
    const startY = 60;
    const lineHeight = 14;
    const lines = [`SCORE:${this.game.score}`, "PRESS S", "TO RESTART"];
    for (let i = 0; i < lines.length; i++) {
      const lineY = startY + i * lineHeight;
      this.screen.drawTextBitmap(startX, lineY, lines[i], "cell-c3", {
        fontFamily: "EarlyGameBoy, monospace",
        fontSize: 10,
      });
      if (i < lines.length - 1) {
        this.screen.drawRect(
          0,
          lineY + lineHeight - 2,
          this.screen.cols,
          1,
          "cell-c2",
        );
      }
    }
  }

  renderImageMode() {
    this.imageGame.render();
  }

  async loadFonts() {
    if (!("FontFace" in window)) return;
    const fontUrl = new URL("assets/EarlyGameBoy.ttf", window.location.href);
    const font = new FontFace("EarlyGameBoy", `url("${fontUrl.href}")`);
    await font.load();
    document.fonts.add(font);
  }

  startLoop() {
    if (this.loopId) clearInterval(this.loopId);
    this.loopId = setInterval(() => {
      if (this.mode === "game") {
        this.game.step(this.appleSprite);
        if (this.game.gameOver) {
          this.mode = "gameover";
          this.renderGameOverScreen();
          return;
        }
        this.game.draw(this.appleSprite);
      }
    }, 120);
  }

  startSnake() {
    this.mode = "game";
    this.game.segmentSprite = this.snakeBodySprite;
    this.game.headSprite = this.snakeHeadSprite;
    this.game.reset();
    this.game.spawnFood(this.appleSprite);
    this.game.draw(this.appleSprite);
  }

  bindInput() {
    window.addEventListener("keydown", (event) => {
      const { key } = event;
      if (key.startsWith("Arrow")) event.preventDefault();
      if (key === "Escape" || key === "s" || key === "S") {
        if (this.mode === "game" || this.mode === "image") {
          event.preventDefault();
          this.showPauseMenu();
          return;
        }
      }
      if (this.mode === "menu") {
        if (key === "ArrowLeft") {
          this.menuIndex =
            (this.menuIndex - 1 + this.menuOptions.length) %
            this.menuOptions.length;
          this.drawMenu();
          return;
        }
        if (key === "ArrowRight") {
          this.menuIndex = (this.menuIndex + 1) % this.menuOptions.length;
          this.drawMenu();
          return;
        }
        if (key === "Enter") {
          const selected = this.menuOptions[this.menuIndex]?.id;
          if (selected === "snake") this.startSnake();
          if (selected === "image") {
            this.mode = "image";
            this.renderImageMode();
          }
          return;
        }
      }
      if (this.mode === "gameover") {
        if (key === "s" || key === "S") {
          this.startSnake();
        }
        if (key === "Escape") this.showMenu();
        return;
      }
      if (this.mode === "game") {
        this.game.setDirection(key);
      }
      if (this.mode === "image") {
        if (key === "l" || key === "L") {
          this.imageInput?.click();
          return;
        }
        if (key === "r" || key === "R") {
          this.imageGame.reloadImage();
          return;
        }
      }
      if (this.mode === "pause") {
        if (key === "c" || key === "C") {
          if (this.prevMode === "image") {
            this.mode = "image";
            this.renderImageMode();
          } else {
            this.mode = "game";
            this.game.draw(this.appleSprite);
          }
        }
        if (key === "q" || key === "Q") {
          this.showMenu();
        }
        return;
      }
    });

    if (!this.imageInput) return;
    this.imageInput.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        this.imageGame.setImage(img);
        this.mode = "image";
        this.imageGame.reloadImage();
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }
}
