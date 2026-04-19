export class GameState {
  constructor({ gold = 10, hp = 100, level = 1 } = {}) {
    this.gold = gold;
    this.hp = hp;
    this.level = level;
  }

  canAfford(amount) {
    return this.gold >= amount;
  }

  deductGold(amount) {
    if (!this.canAfford(amount)) return false;
    this.gold -= amount;
    return true;
  }

  addGold(amount) {
    this.gold += amount;
  }

  takeDamage(amount) {
    this.hp -= amount;
    return this.hp;
  }

  isDefeated() {
    return this.hp <= 0;
  }

  advanceRound({ goldGain = 5 } = {}) {
    this.level += 1;
    this.gold += goldGain;
  }
}
