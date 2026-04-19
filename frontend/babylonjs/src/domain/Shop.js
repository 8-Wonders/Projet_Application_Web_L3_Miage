export class Shop {
  constructor({ pieceDefs, tier = 1, slots = 5, maxTier = 5 } = {}) {
    this.pieceDefs = pieceDefs;
    this.tier = tier;
    this.slots = slots;
    this.maxTier = maxTier;
    this.currentShop = Array.from({ length: slots }, () => null);
  }

  getUpgradeCost(level) {
    return Math.max(2, 6 - level);
  }

  getAvailableTypes() {
    return Object.keys(this.pieceDefs).filter(
      (type) => this.pieceDefs[type].tier <= this.tier,
    );
  }

  generate() {
    const available = this.getAvailableTypes();
    this.currentShop = Array.from({ length: this.slots }, () => {
      return available[Math.floor(Math.random() * available.length)] ?? null;
    });
    return this.currentShop;
  }

  reroll(gameState, cost = 2) {
    if (!gameState.deductGold(cost)) return false;
    this.generate();
    return true;
  }

  upgrade(gameState) {
    if (this.tier >= this.maxTier) return false;
    const cost = this.getUpgradeCost(gameState.level);
    if (!gameState.deductGold(cost)) return false;
    this.tier += 1;
    this.generate();
    return true;
  }

  get(index) {
    return this.currentShop[index];
  }

  markSold(index) {
    this.currentShop[index] = null;
  }
}
