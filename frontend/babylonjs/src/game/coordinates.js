export const fromAlgebraic = (square) => ({
  col: square.charCodeAt(0) - 97,
  row: 8 - parseInt(square[1], 10),
});

export const toSquareId = (algebraic) => {
  const { row, col } = fromAlgebraic(algebraic);
  return `${row}-${col}`;
};
