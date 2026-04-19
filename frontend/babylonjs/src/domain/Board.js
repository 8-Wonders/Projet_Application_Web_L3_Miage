export class Board {
  constructor({ pieceDefs, playerColor = null } = {}) {
    this.pieceDefs = pieceDefs;
    this.playerColor = playerColor;
    this.placedPieces = new Map();
    this.budgets = { white: 0, black: 0 };
    this.counts = {
      white: this.#createCountMap(),
      black: this.#createCountMap(),
    };
  }

  #createCountMap() {
    return Object.fromEntries(Object.keys(this.pieceDefs || {}).map((k) => [k, 0]));
  }

  setPlayerColor(color) {
    this.playerColor = color;
  }

  setBudget(color, value) {
    this.budgets[color] = value;
  }

  adjustBudget(color, delta) {
    this.budgets[color] += delta;
  }

  resetCounts(color) {
    Object.keys(this.counts[color]).forEach((key) => {
      this.counts[color][key] = 0;
    });
  }

  clear() {
    this.placedPieces.clear();
  }

  clearColor(color) {
    this.placedPieces.forEach((entry, squareId) => {
      if (entry.color === color) {
        this.placedPieces.delete(squareId);
      }
    });
  }

  has(squareId) {
    return this.placedPieces.has(squareId);
  }

  get(squareId) {
    return this.placedPieces.get(squareId);
  }

  set(squareId, entry) {
    this.placedPieces.set(squareId, entry);
  }

  delete(squareId) {
    return this.placedPieces.delete(squareId);
  }

  forEach(callback) {
    this.placedPieces.forEach(callback);
  }

  entries() {
    return this.placedPieces.entries();
  }

  values() {
    return this.placedPieces.values();
  }

  replaceAll(entries) {
    this.placedPieces.clear();
    entries.forEach((entry, squareId) => {
      this.placedPieces.set(squareId, entry);
    });
  }

  snapshot() {
    return new Map(this.placedPieces);
  }

  getPiecesForColor(color) {
    return Array.from(this.placedPieces.entries()).filter(([, entry]) => entry.color === color);
  }

  getBenchSquareIds() {
    return Array.from({ length: 8 }, (_, index) => `bench-${index}`);
  }

  findFirstEmptyBenchSquare() {
    return this.getBenchSquareIds().find((squareId) => !this.placedPieces.has(squareId)) ?? null;
  }

  getTileCoordinates(squareId) {
    if (squareId.startsWith("bench-")) {
      const col = parseInt(squareId.split("-")[1], 10);
      return {
        isBench: true,
        row: -1,
        col,
        zPos: this.playerColor === "black" ? -1.5 : 8.5,
      };
    }

    const [row, col] = squareId.split("-").map(Number);
    return { isBench: false, row, col, zPos: row };
  }

  isAllowedPlacement(color, squareId) {
    const coords = this.getTileCoordinates(squareId);
    if (coords.isBench) return color === this.playerColor;
    return color === "white" ? coords.row >= 4 : coords.row <= 3;
  }
}
