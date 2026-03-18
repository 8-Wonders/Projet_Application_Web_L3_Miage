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
    
    // Select exactly 5 shop buttons by ID
    this.selectButtons = [
      document.getElementById("shop-0"),
      document.getElementById("shop-1"),
      document.getElementById("shop-2"),
      document.getElementById("shop-3"),
      document.getElementById("shop-4")
    ];
    this.rerollBtn = document.getElementById("rerollShop");

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
    this.buyPieceBtn = document.getElementById("buyPieceBtn");

    this.selectedPiece = null;
    this.selectedShopIndex = null;

    this.onPieceSelected = null;
    this.onPickSide = null;
    this.onClearBoard = null;
    this.onStartBattle = null;
    this.onBuyPiece = null;
    this.onReroll = null;

    this.attachEvents();
  }

  renderShop(shopArray, playerState) {
    this.selectButtons.forEach((button, index) => {
      if (!button) return;
      const type = shopArray[index];
      
      if (!type) {
        button.innerHTML = `<span>Sold Out</span>`;
        button.disabled = true;
        button.classList.add("unaffordable");
        button.onclick = null;
        return;
      }

      const def = this.pieceDefs[type];
      const label = this.pieceLabels[type] || type;
      const canAfford = playerState.gold >= def.value;

      button.classList.remove("unaffordable");
      button.innerHTML = `<span class="piece-price">💎 ${def.value}</span><span class="piece-name">${label}</span>`;
      button.disabled = false; // Always allow clicking to preview
      button.classList.toggle("unaffordable", !canAfford);
      
      button.onclick = () => {
        this.selectedShopIndex = index;
        
        // Highlight selection
        this.selectButtons.forEach((btn) => btn?.classList.remove("active"));
        button.classList.add("active");

        // Show preview
        if (this.onPieceSelected) {
          this.onPieceSelected(`white-${type}`);
        }

        // Show buy button
        if (this.buyPieceBtn) {
          this.buyPieceBtn.style.display = "block";
          this.buyPieceBtn.textContent = `Buy ${label} (💎 ${def.value})`;
          this.buyPieceBtn.disabled = !canAfford;
        }
      };
    });

    // Handle buy button visibility if the selection persists but state updates
    if (this.buyPieceBtn && this.buyPieceBtn.style.display === "block" && this.selectedShopIndex !== null) {
      const type = shopArray[this.selectedShopIndex];
      if (type) {
        const def = this.pieceDefs[type];
        this.buyPieceBtn.disabled = playerState.gold < def.value;
      } else {
        this.buyPieceBtn.style.display = "none";
      }
    }

    if (this.budgetWhiteEl) {
      this.budgetWhiteEl.textContent = `❤️ ${playerState.hp} | ⭐ Lvl: ${playerState.level} | 🪙 Gold: ${playerState.gold}`;
    }
  }

  clearShopSelection() {
    this.selectedShopIndex = null;
    this.selectButtons.forEach((btn) => btn?.classList.remove("active"));
    if (this.buyPieceBtn) {
      this.buyPieceBtn.style.display = "none";
    }
  }

  attachEvents() {
    if (this.buyPieceBtn) {
      this.buyPieceBtn.addEventListener("click", () => {
        if (this.onBuyPiece && this.selectedShopIndex !== null) {
          this.onBuyPiece(this.selectedShopIndex);
        }
      });
    }

    if (this.rerollBtn) {
      this.rerollBtn.addEventListener("click", () => {
        if (this.onReroll) {
          this.onReroll();
        }
      });
    }

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

  // Deprecated for Gold system, but kept for compatibility
  setBudgets(budgets, playerColor) {
    // We now use Gold: X in budgetWhiteEl
  }

  setPieceVisibility(playerColor, aiColor) {
    // Optional: Hide/Show shop based on state
  }

  updateAvailability(budgets, counts, playerColor) {
    // Re-rendering shop handles availability
  }

  clearSelection() {
    this.selectedPiece = null;
  }

  getSelectedPiece() {
    return this.selectedPiece;
  }
}