import { hpIcon, levelIcon, goldIcon, gemIcon } from "./icons.js";

export class UIManager {
  constructor({ pieceDefs, pieceLabels, pieceMoves }) {
    this.pieceDefs = pieceDefs;
    this.pieceLabels = pieceLabels;
    this.pieceMoves = pieceMoves;

    this.hpValEl = document.getElementById("val-hp");
    this.levelValEl = document.getElementById("val-level");
    this.goldValEl = document.getElementById("val-gold");

    // Inject icons into stat pills
    const hpStat = document.getElementById("stat-hp");
    const levelStat = document.getElementById("stat-level");
    const goldStat = document.getElementById("stat-gold");
    if (hpStat) hpStat.insertAdjacentHTML("afterbegin", hpIcon);
    if (levelStat) levelStat.insertAdjacentHTML("afterbegin", levelIcon);
    if (goldStat) goldStat.insertAdjacentHTML("afterbegin", goldIcon);

    this.sidePicker = document.getElementById("sidePicker");
    this.pickWhite = document.getElementById("pickWhite");
    this.pickBlack = document.getElementById("pickBlack");

    // Select exactly 5 shop buttons by ID
    this.selectButtons = [
      document.getElementById("shop-0"),
      document.getElementById("shop-1"),
      document.getElementById("shop-2"),
      document.getElementById("shop-3"),
      document.getElementById("shop-4"),
    ];
    this.rerollBtn = document.getElementById("rerollShop");
    if (this.rerollBtn) {
      this.rerollBtn.innerHTML = `Reroll <span class="cost-inline">${goldIcon} 2</span>`;
    }

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
    this.dialogModal = document.getElementById("dialogModal");
    this.dialogTitleEl = document.getElementById("dialogTitle");
    this.dialogTextEl = document.getElementById("dialogText");
    this.closeDialogBtn = document.getElementById("closeDialogBtn");
    this.toastContainer = document.getElementById("toastContainer");
    this.onDialogCloseCallback = null;

    this.playbackControls = document.getElementById("playbackControls");
    this.btnPrevTurn = document.getElementById("btnPrevTurn");
    this.btnNextTurn = document.getElementById("btnNextTurn");
    this.btnExitReview = document.getElementById("btnExitReview");
    this.turnCounterText = document.getElementById("turnCounterText");

    this.onPrevTurn = null;
    this.onNextTurn = null;
    this.onExitReview = null;

    this.selectedPiece = null;
    this.selectedShopIndex = null;
    this.playerColor = "white";

    this.onPieceSelected = null;
    this.onPickSide = null;
    this.onClearBoard = null;
    this.onStartBattle = null;
    this.onBuyPiece = null;
    this.onReroll = null;

    this.attachEvents();

    // Create the Sell Zone UI
    this.sellZoneEl = document.createElement("div");
    this.sellZoneEl.id = "sell-zone";
    document.body.appendChild(this.sellZoneEl);
  }

  renderShop(shopArray, playerState) {
    const color = this.playerColor || "white";
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
      button.innerHTML = `<span class="piece-price">${goldIcon} ${def.value}</span><span class="piece-name">${label}</span>`;
      button.disabled = false; // Always allow clicking to preview
      button.classList.toggle("unaffordable", !canAfford);

      button.onclick = () => {
        this.selectedShopIndex = index;
        this.selectedPiece = `${color}-${type}`;

        // Highlight selection
        this.selectButtons.forEach((btn) => btn?.classList.remove("active"));
        button.classList.add("active");

        // Show preview
        if (this.onPieceSelected) {
          this.onPieceSelected(`${color}-${type}`);
        }

        // Show buy button
        if (this.buyPieceBtn) {
          this.buyPieceBtn.style.display = "block";
          this.buyPieceBtn.innerHTML = `Buy ${label} <span class="cost-inline">${goldIcon} ${def.value}</span>`;
          this.buyPieceBtn.disabled = !canAfford;
        }
      };
    });

    // Handle buy button visibility if the selection persists but state updates
    if (
      this.buyPieceBtn &&
      this.buyPieceBtn.style.display === "block" &&
      this.selectedShopIndex !== null
    ) {
      const type = shopArray[this.selectedShopIndex];
      if (type) {
        const def = this.pieceDefs[type];
        this.buyPieceBtn.disabled = playerState.gold < def.value;
      } else {
        this.buyPieceBtn.style.display = "none";
      }
    }

    if (this.hpValEl) this.hpValEl.textContent = playerState.hp;
    if (this.levelValEl) this.levelValEl.textContent = playerState.level;
    if (this.goldValEl) this.goldValEl.textContent = playerState.gold;
  }

  clearShopSelection() {
    this.selectedShopIndex = null;
    this.selectedPiece = null;
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

    if (this.btnPrevTurn) {
      this.btnPrevTurn.addEventListener("click", () => this.onPrevTurn?.());
    }
    if (this.btnNextTurn) {
      this.btnNextTurn.addEventListener("click", () => this.onNextTurn?.());
    }
    if (this.btnExitReview) {
      this.btnExitReview.addEventListener("click", () => this.onExitReview?.());
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
      this.closeMoveButton.addEventListener("click", () =>
        this.hideMoveModal(),
      );
    }
    if (this.closeDialogBtn) {
      this.closeDialogBtn.addEventListener("click", () => {
        this.hideDialog();
        if (this.onDialogCloseCallback) {
          this.onDialogCloseCallback();
          this.onDialogCloseCallback = null;
        }
      });
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
    this.moveTitleEl.innerHTML = title;
    this.moveTextEl.textContent = text;
    this.moveModal.classList.remove("hidden");
  }

  hideMoveModal() {
    if (this.moveModal) {
      this.moveModal.classList.add("hidden");
    }
  }

  showDialog(title, text, onClose = null) {
    if (!this.dialogModal || !this.dialogTitleEl || !this.dialogTextEl) {
      return;
    }
    this.dialogTitleEl.textContent = title;
    this.dialogTextEl.textContent = text;
    this.onDialogCloseCallback = onClose;
    this.dialogModal.classList.remove("hidden");
  }

  hideDialog() {
    if (this.dialogModal) {
      this.dialogModal.classList.add("hidden");
    }
  }

  showToast(message) {
    if (!this.toastContainer) {
      return;
    }
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 3000);
  }

  setSidePickerVisible(visible) {
    if (!this.sidePicker) {
      return;
    }
    this.sidePicker.classList.toggle("hidden", !visible);
  }

  setPlaybackVisible(visible) {
    if (this.playbackControls) {
      this.playbackControls.classList.toggle("hidden", !visible);
    }
  }

  updatePlaybackUI(currentIndex, totalMoves, isReviewing = false) {
    if (this.turnCounterText) {
      // Format as "Ply X / Y"
      this.turnCounterText.textContent = `Ply ${currentIndex} / ${totalMoves}`;
    }
    if (this.btnPrevTurn) {
      this.btnPrevTurn.disabled = currentIndex === 0;
    }
    if (this.btnNextTurn) {
      this.btnNextTurn.disabled = currentIndex === totalMoves;
    }
    if (this.btnExitReview) {
      this.btnExitReview.style.display = isReviewing ? "block" : "none";
    }
  }

  showSellZone(sellValue) {
    this.sellZoneEl.innerHTML = `
      <div class="sell-content">
        <span class="sell-label">SELL</span>
        <span class="sell-value">${sellValue} <span class="icon-inline">${goldIcon}</span></span>
      </div>
    `;
    this.sellZoneEl.style.display = "flex";
  }

  hideSellZone() {
    this.sellZoneEl.style.display = "none";
    this.sellZoneEl.classList.remove("hovered");
  }

  isPointerOverSellZone(px, py) {
    if (this.sellZoneEl.style.display === "none") return false;
    const rect = this.sellZoneEl.getBoundingClientRect();
    return (
      px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom
    );
  }

  highlightSellZone(isHovered) {
    this.sellZoneEl.classList.toggle("hovered", isHovered);
  }

  setPlayerColor(color) {
    this.playerColor = color;
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

  clearSelection() {
    this.selectedPiece = null;
  }

  getSelectedPiece() {
    return this.selectedPiece;
  }
}
