export class SnakeGame {
  constructor(screen, options) {
    this.screen = screen;
    this.options = options;
    this.cellSize = options.cellSize;
    this.cellGap = options.cellGap || 0;
    this.cellStep = this.cellSize + this.cellGap;
    this.segmentSprite = options.segmentSprite || null;
    this.headSprite = options.headSprite || this.segmentSprite;
    this.gridCols = this._calcGridCount(screen.cols);
    this.gridRows = this._calcGridCount(screen.rows);
    this.reset();
  }

  _calcGridCount(size) {
    return Math.floor((size - this.cellSize) / this.cellStep) + 1;
  }

  reset() {
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = null;
    this.gameOver = false;
    this.score = 0;
    this.snake = [
      { x: Math.floor(this.gridCols / 2) + 1, y: Math.floor(this.gridRows / 2) },
      { x: Math.floor(this.gridCols / 2), y: Math.floor(this.gridRows / 2) },
      { x: Math.floor(this.gridCols / 2) - 1, y: Math.floor(this.gridRows / 2) },
    ];
  }

  setDirection(key) {
    if (key === "ArrowUp" && this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
    if (key === "ArrowDown" && this.direction.y !== -1)
      this.nextDirection = { x: 0, y: 1 };
    if (key === "ArrowLeft" && this.direction.x !== 1)
      this.nextDirection = { x: -1, y: 0 };
    if (key === "ArrowRight" && this.direction.x !== -1)
      this.nextDirection = { x: 1, y: 0 };
  }

  rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  spawnFood(sprite) {
    const candidates = [];
    const maxX = this.screen.cols - sprite.width;
    const maxY = this.screen.rows - sprite.height;
    for (let y = 0; y <= maxY; y += this.cellStep) {
      for (let x = 0; x <= maxX; x += this.cellStep) {
        const appleRect = { x, y, w: sprite.width, h: sprite.height };
        const overlaps = this.snake.some((s) => {
          const segRect = {
            x: s.x * this.cellStep,
            y: s.y * this.cellStep,
            w: this.cellSize,
            h: this.cellSize,
          };
          return this.rectsOverlap(appleRect, segRect);
        });
        if (!overlaps) candidates.push({ x, y });
      }
    }
    if (candidates.length === 0) return;
    this.food = candidates[Math.floor(Math.random() * candidates.length)];
  }

  draw(sprite) {
    this.screen.clear(this.options.backgroundClass);
    this.snake.forEach((segment, index) => {
      const startX = segment.x * this.cellStep;
      const startY = segment.y * this.cellStep;
      const sprite = index === 0 ? this.headSprite : this.segmentSprite;
      if (sprite) {
        this.screen.drawSprite(startX, startY, sprite);
      } else {
        this.screen.drawRect(
          startX,
          startY,
          this.cellSize,
          this.cellSize,
          this.options.snakeClass,
        );
      }
    });
    if (this.food) {
      this.screen.drawSprite(this.food.x, this.food.y, sprite);
    }
  }

  step(sprite) {
    if (this.gameOver) return;
    this.direction = this.nextDirection;
    const head = this.snake[0];
    const next = { x: head.x + this.direction.x, y: head.y + this.direction.y };

    if (next.x < 0 || next.y < 0 || next.x >= this.gridCols || next.y >= this.gridRows) {
      this.gameOver = true;
      return;
    }
    const hitSelf = this.snake.some((s) => s.x === next.x && s.y === next.y);
    if (hitSelf) {
      this.gameOver = true;
      return;
    }

    const nextRect = {
      x: next.x * this.cellStep,
      y: next.y * this.cellStep,
      w: this.cellSize,
      h: this.cellSize,
    };
    const ateApple =
      this.food &&
      this.rectsOverlap(nextRect, {
        x: this.food.x,
        y: this.food.y,
        w: sprite.width,
        h: sprite.height,
      });

    this.snake.unshift(next);
    if (ateApple) {
      this.food = null;
      this.score += 1;
      this.spawnFood(sprite);
    } else {
      this.snake.pop();
    }
  }
}
