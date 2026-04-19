export class AIService {
  constructor({ pieceDefs }) {
    this.pieceDefs = pieceDefs;
  }

  planPlacement({ color, board, shopTier }) {
    const candidates = [];
    let remainingBudget = board.budgets[color];
    const remainingCounts = { ...board.counts[color] };

    const boardSquares = [];
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const squareId = `${row}-${col}`;
        if (board.isAllowedPlacement(color, squareId)) {
          boardSquares.push(squareId);
        }
      }
    }

    for (let i = boardSquares.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [boardSquares[i], boardSquares[j]] = [boardSquares[j], boardSquares[i]];
    }

    boardSquares.forEach((squareId) => {
      const coords = board.getTileCoordinates(squareId);
      const affordable = Object.entries(this.pieceDefs).filter(([type, def]) => {
        if (def.tier > shopTier) return false;
        if (type === "pawn" && !coords.isBench && (coords.row === 0 || coords.row === 7)) {
          return false;
        }
        return (
          remainingCounts[type] < def.max &&
          remainingBudget >= def.value
        );
      });

      if (!affordable.length) return;
      const [type] = affordable[Math.floor(Math.random() * affordable.length)];
      candidates.push({ squareId, type });
      remainingBudget -= this.pieceDefs[type].value;
      remainingCounts[type] += 1;
    });

    return candidates;
  }
}
