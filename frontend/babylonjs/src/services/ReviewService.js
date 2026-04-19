export class ReviewService {
  constructor({ combatRecord }) {
    this.combatRecord = combatRecord;
  }

  canUndo({ gameInProgress }) {
    return !gameInProgress && this.combatRecord.canUndo;
  }

  canRedo({ gameInProgress }) {
    return !gameInProgress && this.combatRecord.canRedo;
  }

  ensureReviewSnapshot(board) {
    if (this.combatRecord.isReviewing) return false;
    this.combatRecord.snapshotNextRound(board);
    this.combatRecord.enterReview();
    return true;
  }

  exitReview(board) {
    if (!this.combatRecord.isReviewing) return null;
    this.combatRecord.exitReview();
    return new Map(this.combatRecord.savedNextRoundPieces);
  }

  getPreviousMove() {
    return this.combatRecord.getPrevious();
  }

  getNextMove() {
    return this.combatRecord.getCurrent();
  }

  stepBackward() {
    this.combatRecord.stepBackward();
  }

  stepForward() {
    this.combatRecord.stepForward();
  }
}
