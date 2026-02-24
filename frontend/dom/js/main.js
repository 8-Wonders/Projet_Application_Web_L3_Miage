window.addEventListener("load", () => {
  const cols = 160;
  const rows = 144;
  const gbDisplay = document.getElementById("gb-display");
  const cells = new Array(cols * rows);

  for (let i = 0; i < cells.length; i++) {
    const cell = document.createElement("div");
    cell.className = "pixel cell-c1";
    gbDisplay.appendChild(cell);
    cells[i] = cell;
  }

  const sprite = {
    x: Math.floor(cols / 2) - 4,
    y: Math.floor(rows / 2) - 4,
    w: 8,
    h: 8,
  };

  const bgClass = "cell-c1";
  const spriteClass = "cell-c4";

  const setCellClass = (x, y, className) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    const idx = y * cols + x;
    const cell = cells[idx];
    cell.classList.remove(bgClass, spriteClass);
    cell.classList.add(className);
  };

  const drawSprite = (x, y) => {
    for (let sy = 0; sy < sprite.h; sy++) {
      for (let sx = 0; sx < sprite.w; sx++) {
        setCellClass(x + sx, y + sy, spriteClass);
      }
    }
  };

  const clearSprite = (x, y) => {
    for (let sy = 0; sy < sprite.h; sy++) {
      for (let sx = 0; sx < sprite.w; sx++) {
        setCellClass(x + sx, y + sy, bgClass);
      }
    }
  };

  drawSprite(sprite.x, sprite.y);

  const move = (dx, dy) => {
    const nextX = Math.max(0, Math.min(cols - sprite.w, sprite.x + dx));
    const nextY = Math.max(0, Math.min(rows - sprite.h, sprite.y + dy));
    if (nextX === sprite.x && nextY === sprite.y) return;
    clearSprite(sprite.x, sprite.y);
    sprite.x = nextX;
    sprite.y = nextY;
    drawSprite(sprite.x, sprite.y);
  };

  window.addEventListener("keydown", (event) => {
    const { key } = event;
    if (key.startsWith("Arrow")) event.preventDefault();
    if (key === "ArrowUp") move(0, -1);
    if (key === "ArrowDown") move(0, 1);
    if (key === "ArrowLeft") move(-1, 0);
    if (key === "ArrowRight") move(1, 0);
  });
});
