const pieceCharMap = {
  pawn: "p",
  rook: "r",
  knight: "n",
  bishop: "b",
  queen: "q",
  camel: "c",
  wizzard: "w",
  archbishop: "a",
  chancellor: "h",
  amazon: "z",
  immobilizer: "i",
  fool: "f",
  mammoth: "m",
};

const toPieceChar = (type, color) => {
  const c = pieceCharMap[type] || "p";
  return color === "white" ? c.toUpperCase() : c.toLowerCase();
};

export const generateFEN = (placedPieces, turn) => {
  let fen = "";

  let pieceCount = 0;

  for (let row = 0; row < 8; row += 1) {
    let empty = 0;

    for (let col = 0; col < 8; col += 1) {
      const squareId = `${row}-${col}`;

      const piece = placedPieces.get(squareId);

      if (piece) {
        pieceCount += 1;

        if (empty > 0) {
          fen += empty;
          empty = 0;
        }

        fen += toPieceChar(piece.type, piece.color);
      } else {
        empty += 1;
      }
    }

    if (empty > 0) {
      fen += empty;
    }

    if (row < 7) {
      fen += "/";
    }
  }

  fen += ` ${turn === "white" ? "w" : "b"} - - 0 1`;

  console.log("Generated FEN:", fen, "Pieces in FEN:", pieceCount);

  return fen;
};
