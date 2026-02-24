import { font5x7 } from "./font.js";

export class GBScreen {
  constructor({ cols, rows, root, palette }) {
    this.cols = cols;
    this.rows = rows;
    this.root = root;
    this.palette = palette;
    this.cells = new Array(cols * rows);
    this._initGrid();
  }

  _initGrid() {
    this.root.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
    this.root.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
    for (let i = 0; i < this.cells.length; i++) {
      const cell = document.createElement("div");
      cell.className = "pixel cell-c1";
      this.root.appendChild(cell);
      this.cells[i] = cell;
    }
  }

  setPixel(x, y, className) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    const idx = y * this.cols + x;
    this.cells[idx].className = `pixel ${className}`;
  }

  clear(className) {
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i].className = `pixel ${className}`;
    }
  }

  drawRect(x, y, w, h, className) {
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        this.setPixel(x + px, y + py, className);
      }
    }
  }

  drawSprite(x, y, sprite) {
    for (let py = 0; py < sprite.height; py++) {
      for (let px = 0; px < sprite.width; px++) {
        const value = sprite.pixels[py][px];
        if (value === 0) continue;
        this.setPixel(x + px, y + py, `cell-c${value}`);
      }
    }
  }

  drawText(x, y, text, className, font = font5x7) {
    const scale = font.scale || 1;
    const spacing = font.spacing ?? 1;
    let cursorX = x;
    for (const char of text.toUpperCase()) {
      const glyph = font.glyphs[char] || font.glyphs["?"];
      for (let row = 0; row < font.height; row++) {
        const rowBits = glyph[row] || 0;
        for (let col = 0; col < font.width; col++) {
          if (rowBits & (1 << (font.width - 1 - col))) {
            const px = cursorX + col * scale;
            const py = y + row * scale;
            this.drawRect(px, py, scale, scale, className);
          }
        }
      }
      cursorX += (font.width + spacing) * scale;
    }
  }

  rgbToPaletteClass(r, g, b) {
    let best = this.palette[0];
    let bestDist = Infinity;
    for (const color of this.palette) {
      const dr = r - color.r;
      const dg = g - color.g;
      const db = b - color.b;
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        best = color;
      }
    }
    return best.className;
  }

  convertImageToGB(image, backgroundClass) {
    const canvas = document.createElement("canvas");
    canvas.width = this.cols;
    canvas.height = this.rows;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, this.cols, this.rows);
    const imageData = ctx.getImageData(0, 0, this.cols, this.rows);
    const data = imageData.data;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const idx = (y * this.cols + x) * 4;
        const alpha = data[idx + 3];
        if (alpha < 10) {
          this.setPixel(x, y, backgroundClass);
          continue;
        }
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const className = this.rgbToPaletteClass(r, g, b);
        this.setPixel(x, y, className);
      }
    }
  }

  drawTextBitmap(x, y, text, className, options) {
    const fontFamily = options?.fontFamily || "sans-serif";
    const fontSize = options?.fontSize || 16;
    const padding = options?.padding ?? 2;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = `${fontSize}px "${fontFamily}"`;
    const metrics = ctx.measureText(text);
    const width = Math.ceil(metrics.width) + padding * 2;
    const height = Math.ceil(fontSize * 1.2) + padding * 2;
    canvas.width = width;
    canvas.height = height;
    const draw = canvas.getContext("2d");
    draw.imageSmoothingEnabled = false;
    draw.font = `${fontSize}px "${fontFamily}"`;
    draw.fillStyle = "#fff";
    draw.textBaseline = "top";
    draw.fillText(text, padding, padding);
    const imageData = draw.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let py = 0; py < canvas.height; py++) {
      for (let px = 0; px < canvas.width; px++) {
        const idx = (py * canvas.width + px) * 4;
        if (data[idx + 3] > 10) {
          this.setPixel(x + px, y + py, className);
        }
      }
    }
  }

  measureTextBitmap(text, options) {
    const fontFamily = options?.fontFamily || "sans-serif";
    const fontSize = options?.fontSize || 16;
    const padding = options?.padding ?? 2;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.font = `${fontSize}px "${fontFamily}"`;
    const metrics = ctx.measureText(text);
    const width = Math.ceil(metrics.width) + padding * 2;
    const height = Math.ceil(fontSize * 1.2) + padding * 2;
    return { width, height };
  }

  static async loadSprite(path) {
    const res = await fetch(path);
    const text = await res.text();
    const rowsData = text
      .trim()
      .split(/\r?\n/)
      .map((line) => line.split(",").map((v) => Number(v.trim())));
    return {
      pixels: rowsData,
      width: rowsData[0]?.length || 0,
      height: rowsData.length,
    };
  }
}
