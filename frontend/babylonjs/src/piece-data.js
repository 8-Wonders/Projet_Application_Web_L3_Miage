export const pieceDefs = {
  pawn: { value: 1, max: 8 },
  rook: { value: 5, max: 2 },
  knight: { value: 3, max: 2 },
  bishop: { value: 3, max: 2 },
  queen: { value: 9, max: 1 },
  camel: { value: 3, max: 2 },
  wizzard: { value: 3, max: 2 },
  archbishop: { value: 7, max: 2 },
  chancellor: { value: 8, max: 2 },
  amazon: { value: 12, max: 1 },
  immobilizer: { value: 5, max: 1 },
  fool: { value: 0, max: 1 },
  mammoth: { value: 5, max: 2 },
};

export const pieceAssets = {
  pawn: { file: "pawn.stl", height: 1.4 },
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
  mammoth: { file: "Mammoth.stl", height: 2 },
};

export const pieceMoves = {
  pawn: "Forward 1 square (2 from starting rank), captures 1 square diagonally forward.",
  rook: "Any number of squares vertically or horizontally.",
  knight: "L-shape: 2 squares in one direction, then 1 perpendicular. Jumps.",
  bishop: "Any number of squares diagonally.",
  queen: "Any number of squares vertically, horizontally, or diagonally.",
  camel: "Leaps in a (3,1) L-shape. Jumps.",
  wizzard:
    "Combines Ferz and Camel: Ferz moves 1 square diagonally; Camel is a (3,1) leaper. Jumps.",
  archbishop: "Bishop or knight (combined).",
  chancellor: "Rook or knight (combined).",
  amazon: "Queen or knight (combined).",
  immobilizer:
    "Moves like a queen but cannot capture. Freezing aura is not enforced in the engine.",
  fool: "Cannot move or capture.",
  mammoth:
    "King + Alfil + Dabbaba: 1 square any direction, or a 2-square diagonal/orthogonal leap. Jumps.",
};

export const pieceLabels = {
  pawn: "Pawn",
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

export const pieceYawFix = {
  knight: -Math.PI / 2,
};

export const pieceYOffset = {
  pawn: 0.12,
  rook: 0.12,
  knight: 0.12,
  queen: 0.12,
};
