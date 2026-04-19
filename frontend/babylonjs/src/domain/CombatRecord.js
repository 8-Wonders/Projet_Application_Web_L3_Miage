export class CombatRecord {
  constructor() {
    this.detailedHistory = [];
    this.battleEndPlacedPieces = new Map();
    this.savedNextRoundPieces = new Map();
    this.currentPlyIndex = 0;
    this.isReviewing = false;
  }

  reset() {
    this.detailedHistory = [];
    this.battleEndPlacedPieces = new Map();
    this.savedNextRoundPieces = new Map();
    this.currentPlyIndex = 0;
    this.isReviewing = false;
  }

  push(historyRecord) {
    this.detailedHistory.push(historyRecord);
    this.currentPlyIndex = this.detailedHistory.length;
  }

  get length() {
    return this.detailedHistory.length;
  }

  get canUndo() {
    return this.currentPlyIndex > 0;
  }

  get canRedo() {
    return this.currentPlyIndex < this.detailedHistory.length;
  }

  getCurrent() {
    return this.detailedHistory[this.currentPlyIndex];
  }

  getPrevious() {
    return this.detailedHistory[this.currentPlyIndex - 1];
  }

  snapshotBattleEnd(boardSnapshot) {
    this.battleEndPlacedPieces = new Map(boardSnapshot);
  }

  snapshotNextRound(boardSnapshot) {
    this.savedNextRoundPieces = new Map(boardSnapshot);
  }

  enterReview() {
    this.isReviewing = true;
  }

  exitReview() {
    this.isReviewing = false;
    this.currentPlyIndex = this.detailedHistory.length;
  }

  stepBackward() {
    this.currentPlyIndex -= 1;
  }

  stepForward() {
    this.currentPlyIndex += 1;
  }
}
