export class UIManager {
  constructor({ pieceDefs, pieceLabels, pieceMoves }) {
    this.pieceDefs = pieceDefs;
    this.pieceLabels = pieceLabels;
    this.pieceMoves = pieceMoves;

    this.budgetWhiteEl = document.getElementById("budgetWhite");
    this.budgetBlackEl = document.getElementById("budgetBlack");
    this.sidePicker = document.getElementById("sidePicker");
    this.pickWhite = document.getElementById("pickWhite");
    this.pickBlack = document.getElementById("pickBlack");
    this.selectButtons = document.querySelectorAll(".piece-group .piece-btn");
    this.groupWhite = document.querySelector(
      '.piece-group[data-color="white"]',
    );
    this.groupBlack = document.querySelector(
      '.piece-group[data-color="black"]',
    );
    this.clearButton = document.getElementById("clearBoard");
    this.startBattleBtn = document.getElementById("startBattle");
    this.moveModal = document.getElementById("moveModal");
    this.moveTitleEl = document.getElementById("moveTitle");
    this.moveTextEl = document.getElementById("moveText");
    this.closeMoveButton = document.getElementById("closeMove");
    this.aboutMoveButton = document.getElementById("aboutMove");

    this.selectedPiece = null;

    this.onPieceSelected = null;
    this.onPickSide = null;
    this.onClearBoard = null;
    this.onStartBattle = null;

    this.attachEvents();
  }

  attachEvents() {
    this.selectButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (button.disabled) {
          return;
        }
        this.selectButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        this.selectedPiece = button.dataset.piece;
        if (this.onPieceSelected) {
          this.onPieceSelected(this.selectedPiece);
        }
      });
    });

    if (this.pickWhite) {
      this.pickWhite.addEventListener("click", () => {
        if (this.onPickSide) {
          this.onPickSide("white");
        }
      });
    }
    if (this.pickBlack) {
      this.pickBlack.addEventListener("click", () => {
        if (this.onPickSide) {
          this.onPickSide("black");
        }
      });
    }

    if (this.clearButton) {
      this.clearButton.addEventListener("click", () => {
        if (this.onClearBoard) {
          this.onClearBoard();
        }
      });
    }

    if (this.startBattleBtn) {
      this.startBattleBtn.addEventListener("click", () => {
        if (this.onStartBattle) {
          this.onStartBattle();
        }
      });
    }

    if (this.aboutMoveButton) {
      this.aboutMoveButton.addEventListener("click", () => {
        if (!this.selectedPiece) {
          this.showMoveModal("Select a piece", "Choose a piece first.");
          return;
        }
        const [, type] = this.selectedPiece.split("-");
        const label = this.pieceLabels[type] || type;
        this.showMoveModal(
          `${label} movement`,
          this.pieceMoves[type] || "No movement info available.",
        );
      });
    }

    if (this.closeMoveButton) {
      this.closeMoveButton.addEventListener("click", () => this.hideMoveModal());
    }
    if (this.moveModal) {
      this.moveModal.addEventListener("click", (event) => {
        if (event.target === this.moveModal) {
          this.hideMoveModal();
        }
      });
    }
  }

  showMoveModal(title, text) {
    if (!this.moveModal || !this.moveTitleEl || !this.moveTextEl) {
      return;
    }
    this.moveTitleEl.textContent = title;
    this.moveTextEl.textContent = text;
    this.moveModal.classList.remove("hidden");
  }

  hideMoveModal() {
    if (this.moveModal) {
      this.moveModal.classList.add("hidden");
    }
  }

  setSidePickerVisible(visible) {
    if (!this.sidePicker) {
      return;
    }
    this.sidePicker.classList.toggle("hidden", !visible);
  }

  setStartBattleState({ inProgress }) {
    if (!this.startBattleBtn) {
      return;
    }
    this.startBattleBtn.textContent = inProgress
      ? "Battle in progress..."
      : "Fight!";
    this.startBattleBtn.disabled = inProgress;
  }

  setBudgets(budgets, playerColor) {
    if (this.budgetWhiteEl) {
      const label = playerColor
        ? playerColor === "white"
          ? "Your budget"
          : "AI budget"
        : "White budget";
      this.budgetWhiteEl.textContent = `${label}: ${budgets.white}`;
    }
    if (this.budgetBlackEl) {
      const label = playerColor
        ? playerColor === "black"
          ? "Your budget"
          : "AI budget"
        : "Black budget";
      this.budgetBlackEl.textContent = `${label}: ${budgets.black}`;
    }
  }

  setPieceVisibility(playerColor, aiColor) {
    if (!playerColor || !aiColor) {
      if (this.groupWhite) this.groupWhite.classList.add("hidden");
      if (this.groupBlack) this.groupBlack.classList.add("hidden");
      return;
    }
    const showWhite = playerColor === "white";
    if (this.groupWhite) this.groupWhite.classList.toggle("hidden", !showWhite);
    if (this.groupBlack) this.groupBlack.classList.toggle("hidden", showWhite);
  }

  updateAvailability(budgets, counts, playerColor) {
    this.selectButtons.forEach((button) => {
      if (!playerColor) {
        button.disabled = true;
        button.classList.remove("active");
        return;
      }
      const [color, type] = button.dataset.piece.split("-");
      if (color !== playerColor) {
        button.disabled = true;
        button.classList.remove("active");
        return;
      }
      const def = this.pieceDefs[type];
      const canAfford =
        budgets[color] >= def.value && counts[color][type] < def.max;
      button.disabled = !canAfford;
      if (!canAfford && button.classList.contains("active")) {
        button.classList.remove("active");
        this.selectedPiece = null;
        if (this.onPieceSelected) {
          this.onPieceSelected(null);
        }
      }
    });
  }

  clearSelection() {
    this.selectButtons.forEach((btn) => btn.classList.remove("active"));
    this.selectedPiece = null;
  }

  getSelectedPiece() {
    return this.selectedPiece;
  }
}
