export const pieceDefs = {
  // Tier 1 – starter pieces (cheap, basic)
  pawn: { value: 1, max: 8, tier: 1 },
  vizier: { value: 1, max: 4, tier: 1 }, // Ferz – 1 diagonal step
  knight: { value: 3, max: 2, tier: 1 },
  bishop: { value: 3, max: 2, tier: 1 },

  // Tier 2 – intermediate power
  rook: { value: 5, max: 2, tier: 2 },
  camel: { value: 3, max: 2, tier: 2 },
  wizzard: { value: 3, max: 2, tier: 2 },
  fool: { value: 0, max: 1, tier: 2 },

  // Tier 3 – advanced combiners
  archbishop: { value: 7, max: 2, tier: 3 },
  mammoth: { value: 5, max: 2, tier: 3 },

  // Tier 4 – high value threats
  chancellor: { value: 8, max: 2, tier: 4 },
  queen: { value: 9, max: 1, tier: 4 },
  immobilizer: { value: 5, max: 1, tier: 4 },

  // Tier 5 – legendary
  amazon: { value: 12, max: 1, tier: 5 },
};

export const pieceAssets = {
  pawn: { file: "pawn.stl", height: 1.4 },
  vizier: { file: "vizier.stl", height: 1.3 },
  rook: { file: "rook.stl", height: 1.5 },
  knight: { file: "knight.stl", height: 1.6 },
  bishop: { file: "bishop.stl", height: 1.6 },
  queen: { file: "queen.stl", height: 1.8 },
  camel: { file: "camel.stl", height: 1.6 },
  wizzard: { file: "wizzard.stl", height: 1.4 },
  archbishop: { file: "Archbishop21.stl", height: 1.8 },
  chancellor: { file: "Marshall.stl", height: 1.8 },
  amazon: { file: "Amazon_Dragon.stl", height: 2.2 },
  immobilizer: { file: "Immobilizer.stl", height: 1.8 },
  fool: { file: "fool.stl", height: 1.2 },
  mammoth: { file: "Mammoth.stl", height: 2.0 },
};

export const pieceMoves = {
  pawn: "Forward 1 square (2 from starting rank), captures 1 square diagonally forward.",
  vizier:
    "Moves 1 square diagonally in any direction. Cannot capture en passant.",
  rook: "Any number of squares vertically or horizontally.",
  knight: "L-shape: 2 squares in one direction, then 1 perpendicular. Jumps.",
  bishop: "Any number of squares diagonally.",
  queen: "Any number of squares vertically, horizontally, or diagonally.",
  camel: "Leaps in a (3,1) L-shape. Jumps.",
  wizzard:
    "Combines Ferz and Camel: 1 square diagonally or a (3,1) leap. Jumps.",
  archbishop: "Bishop or knight (combined).",
  chancellor: "Rook or knight (combined).",
  amazon: "Queen or knight (combined).",
  immobilizer: "Moves like a queen but cannot capture. Freezes nearby enemies.",
  fool: "Cannot move or capture. A decoy.",
  mammoth:
    "King + Alfil + Dabbaba: 1 step any direction, or a 2-square diagonal/orthogonal leap. Jumps.",
};

export const pieceLabels = {
  pawn: "Pawn",
  vizier: "Vizier",
  rook: "Rook",
  knight: "Knight",
  bishop: "Bishop",
  queen: "Queen",
  camel: "Camel",
  wizzard: "Wizard",
  archbishop: "Archbishop",
  chancellor: "Chancellor",
  amazon: "Amazon",
  immobilizer: "Immobilizer",
  fool: "Fool",
  mammoth: "Mammoth",
};

// Tier names shown in the UI
export const tierNames = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond",
};

export const pieceYawFix = {
  knight: -Math.PI / 2,
};

export const pieceYOffset = {
  pawn: 0.12,
  rook: 0.12,
  knight: 0.12,
  queen: 0.12,
};
