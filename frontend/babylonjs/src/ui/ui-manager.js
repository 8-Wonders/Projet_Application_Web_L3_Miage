import { hpIcon, goldIcon, gemIcon } from "./icons.js";

// Tier display colours (border tint only)
const TIER_COLOURS = {
  1: "#8ea1c8",
  2: "#b0c4de",
  3: "#ffd700",
  4: "#b0e0ff",
  5: "#80ffff",
};

const TIER_NAMES = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond",
};

export class UIManager {
  constructor({ pieceDefs, pieceLabels, pieceMoves }) {
    this.pieceDefs = pieceDefs;
    this.pieceLabels = pieceLabels;
    this.pieceMoves = pieceMoves;

    this.hpValEl = document.getElementById("val-hp");
    this.roundValEl = document.getElementById("val-round"); // ← was val-level
    this.goldValEl = document.getElementById("val-gold");

    // Inject icons into stat pills (round pill gets no icon – text label is enough)
    const hpStat = document.getElementById("stat-hp");
    const goldStat = document.getElementById("stat-gold");
    if (hpStat) hpStat.insertAdjacentHTML("afterbegin", hpIcon);
    if (goldStat) goldStat.insertAdjacentHTML("afterbegin", gemIcon);

    this.sidePicker = document.getElementById("sidePicker");
    this.pickWhite = document.getElementById("pickWhite");
    this.pickBlack = document.getElementById("pickBlack");

    this.selectButtons = [
      document.getElementById("shop-0"),
      document.getElementById("shop-1"),
      document.getElementById("shop-2"),
      document.getElementById("shop-3"),
      document.getElementById("shop-4"),
    ];

    this.rerollBtn = document.getElementById("rerollShop");
    if (this.rerollBtn) {
      this.rerollBtn.innerHTML = `Reroll <span class="cost-inline">${gemIcon} 2</span>`;
    }

    // Shop tier elements
    this.shopTierLabelEl = document.getElementById("shopTierLabel");
    this.upgradeShopBtn = document.getElementById("upgradeShopBtn");

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
    this.onUpgradeShop = null; // ← NEW

    this.attachEvents();

    this.sellZoneEl = document.createElement("div");
    this.sellZoneEl.id = "sell-zone";
    document.body.appendChild(this.sellZoneEl);
  }

  /* ------------------------------------------------------------------ */
  /*  Shop rendering                                                      */
  /* ------------------------------------------------------------------ */

  renderShop(shopArray, playerState, shopTier = 1, upgradeCost = 5) {
    const color = this.playerColor || "white";

    // ── Shop item buttons ──
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
      const tierColor = TIER_COLOURS[def.tier] || "#8ea1c8";

      button.classList.remove("unaffordable");
      button.style.borderTopColor = tierColor;
      button.innerHTML = `
        <span class="piece-price">${gemIcon} ${def.value}</span>
        <span class="piece-name">${label}</span>
        <span style="font-size:10px;opacity:0.5;color:${tierColor}">T${def.tier}</span>
      `;
      button.disabled = false;
      button.classList.toggle("unaffordable", !canAfford);

      button.onclick = () => {
        this.selectedShopIndex = index;
        this.selectedPiece = `${color}-${type}`;

        this.selectButtons.forEach((btn) => btn?.classList.remove("active"));
        button.classList.add("active");

        if (this.onPieceSelected) this.onPieceSelected(`${color}-${type}`);

        if (this.buyPieceBtn) {
          this.buyPieceBtn.style.display = "block";
          this.buyPieceBtn.innerHTML = `Buy ${label} <span class="cost-inline">${gemIcon} ${def.value}</span>`;
          this.buyPieceBtn.disabled = !canAfford;
        }
      };
    });

    // Keep buy button in sync if something is already selected
    if (
      this.buyPieceBtn &&
      this.buyPieceBtn.style.display === "block" &&
      this.selectedShopIndex !== null
    ) {
      const type = shopArray[this.selectedShopIndex];
      if (type) {
        this.buyPieceBtn.disabled =
          playerState.gold < this.pieceDefs[type].value;
      } else {
        this.buyPieceBtn.style.display = "none";
      }
    }

    // ── Tier label ──
    if (this.shopTierLabelEl) {
      const tierName = TIER_NAMES[shopTier] || `Tier ${shopTier}`;
      this.shopTierLabelEl.textContent = `Tier ${shopTier} · ${tierName} Shop`;
      this.shopTierLabelEl.style.color = TIER_COLOURS[shopTier] || "#8ea1c8";
    }

    // ── Upgrade button ──
    if (this.upgradeShopBtn) {
      const MAX_TIER = 5;
      if (shopTier >= MAX_TIER) {
        this.upgradeShopBtn.innerHTML = "✦ Max Tier";
        this.upgradeShopBtn.disabled = true;
        this.upgradeShopBtn.style.opacity = "0.4";
      } else {
        const canAfford = playerState.gold >= upgradeCost;
        this.upgradeShopBtn.innerHTML = `▲ T${shopTier + 1} <span class="cost-inline" style="font-size:11px">${gemIcon} ${upgradeCost}</span>`;
        this.upgradeShopBtn.disabled = !canAfford;
        this.upgradeShopBtn.style.opacity = canAfford ? "1" : "0.55";
      }
    }

    // ── Stats ──
    if (this.hpValEl) this.hpValEl.textContent = playerState.hp;
    if (this.roundValEl) this.roundValEl.textContent = playerState.level;
    if (this.goldValEl) this.goldValEl.textContent = playerState.gold;
  }

  clearShopSelection() {
    this.selectedShopIndex = null;
    this.selectedPiece = null;
    this.selectButtons.forEach((btn) => btn?.classList.remove("active"));
    if (this.buyPieceBtn) this.buyPieceBtn.style.display = "none";
  }

  /* ------------------------------------------------------------------ */
  /*  Event wiring                                                        */
  /* ------------------------------------------------------------------ */

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
        if (this.onReroll) this.onReroll();
      });
    }

    if (this.upgradeShopBtn) {
      this.upgradeShopBtn.addEventListener("click", () => {
        if (this.onUpgradeShop) this.onUpgradeShop();
      });
    }

    if (this.pickWhite) {
      this.pickWhite.addEventListener("click", () => {
        if (this.onPickSide) this.onPickSide("white");
      });
    }
    if (this.pickBlack) {
      this.pickBlack.addEventListener("click", () => {
        if (this.onPickSide) this.onPickSide("black");
      });
    }

    if (this.clearButton) {
      this.clearButton.addEventListener("click", () => {
        if (this.onClearBoard) this.onClearBoard();
      });
    }

    if (this.startBattleBtn) {
      this.startBattleBtn.addEventListener("click", () => {
        if (this.onStartBattle) this.onStartBattle();
      });
    }

    if (this.btnPrevTurn)
      this.btnPrevTurn.addEventListener("click", () => this.onPrevTurn?.());
    if (this.btnNextTurn)
      this.btnNextTurn.addEventListener("click", () => this.onNextTurn?.());
    if (this.btnExitReview)
      this.btnExitReview.addEventListener("click", () => this.onExitReview?.());

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
        if (event.target === this.moveModal) this.hideMoveModal();
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Modals & toasts                                                     */
  /* ------------------------------------------------------------------ */

  showMoveModal(title, text) {
    if (!this.moveModal || !this.moveTitleEl || !this.moveTextEl) return;
    this.moveTitleEl.innerHTML = title;
    this.moveTextEl.textContent = text;
    this.moveModal.classList.remove("hidden");
  }

  hideMoveModal() {
    if (this.moveModal) this.moveModal.classList.add("hidden");
  }

  showDialog(title, text, onClose = null) {
    if (!this.dialogModal || !this.dialogTitleEl || !this.dialogTextEl) return;
    this.dialogTitleEl.textContent = title;
    this.dialogTextEl.textContent = text;
    this.onDialogCloseCallback = onClose;
    this.dialogModal.classList.remove("hidden");
  }

  hideDialog() {
    if (this.dialogModal) this.dialogModal.classList.add("hidden");
  }

  showToast(message) {
    if (!this.toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    this.toastContainer.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 3000);
  }

  /* ------------------------------------------------------------------ */
  /*  Misc helpers                                                        */
  /* ------------------------------------------------------------------ */

  setSidePickerVisible(visible) {
    if (!this.sidePicker) return;
    this.sidePicker.classList.toggle("hidden", !visible);
  }

  setPlaybackVisible(visible) {
    if (this.playbackControls)
      this.playbackControls.classList.toggle("hidden", !visible);
  }

  updatePlaybackUI(currentIndex, totalMoves, isReviewing = false) {
    if (this.turnCounterText) {
      this.turnCounterText.textContent = `Ply ${currentIndex} / ${totalMoves}`;
    }
    if (this.btnPrevTurn) this.btnPrevTurn.disabled = currentIndex === 0;
    if (this.btnNextTurn)
      this.btnNextTurn.disabled = currentIndex === totalMoves;
    if (this.btnExitReview)
      this.btnExitReview.style.display = isReviewing ? "block" : "none";
  }

  showSellZone(sellValue) {
    this.sellZoneEl.innerHTML = `
      <div class="sell-content">
        <span class="sell-label">SELL</span>
        <span class="sell-value">${sellValue} <span class="icon-inline">${gemIcon}</span></span>
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
    if (!this.startBattleBtn) return;
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
