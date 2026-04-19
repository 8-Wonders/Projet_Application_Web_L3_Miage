const PROMOTION_MAP = {
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  a: "archbishop",
  h: "chancellor",
  c: "camel",
  w: "wizzard",
  z: "amazon",
  i: "immobilizer",
  f: "fool",
  m: "mammoth",
  v: "vizier",
  t: "centaur",
  e: "cheetah",
  d: "dabbaba",
  y: "missionary",
  s: "snake",
  x: "spy",
};

export class CombatService {
  constructor({
    board,
    playerState,
    combatRecord,
    engineClient,
    boardRenderer,
    timerDisplay,
    uiManager,
    pieceDefs,
    generateFEN,
  }) {
    this.board = board;
    this.playerState = playerState;
    this.combatRecord = combatRecord;
    this.engineClient = engineClient;
    this.boardRenderer = boardRenderer;
    this.timerDisplay = timerDisplay;
    this.uiManager = uiManager;
    this.pieceDefs = pieceDefs;
    this.generateFEN = generateFEN;

    this.onRoundEnd = null;

    this.playerColor = "white";
    this.aiColor = "black";
    this.gameInProgress = false;
    this.currentTurn = "white";
    this.initialFen = "";
    this.moveHistory = [];
    this.desyncRetries = 0;
    this.noMoveCount = 0;
    this.moveStartTime = 0;
    this.preCombatPlayerState = [];
    this.lastEvalScore = null;
    this.MAX_DESYNC_RETRIES = 2;

    this.initEngine();
  }

  setSides({ playerColor, aiColor }) {
    this.playerColor = playerColor;
    this.aiColor = aiColor;
  }

  start() {
    if (this.gameInProgress) return false;

    this.gameInProgress = true;
    this.desyncRetries = 0;
    this.noMoveCount = 0;
    this.lastEvalScore = null;
    this.currentTurn = "white";
    this.moveHistory = [];
    this.initialFen = this.generateFEN(this.board.snapshot(), "white");
    this.preCombatPlayerState = [];

    this.board.forEach((entry, squareId) => {
      if (entry.color === this.playerColor && !squareId.startsWith("bench")) {
        this.preCombatPlayerState.push({ squareId, type: entry.type });
      }
    });

    this.combatRecord.reset();
    this.uiManager.setPlaybackVisible(true);
    this.uiManager.updatePlaybackUI(0, 0, false);
    this.uiManager.setStartBattleState({ inProgress: true });
    this.boardRenderer.clearLastEvalScore();
    this.boardRenderer.setAnalysisVisible(true);
    this.timerDisplay.start(
      () => this.endCombat(false, 15, true),
      () => this.endCombat(true, 0, true),
    );
    this.timerDisplay.setActiveTurn(this.currentTurn);

    this.engineClient.startBattle(() => {
      if (this.gameInProgress) this.requestEngineMove();
    });
    return true;
  }

  endCombat(playerWon, damageTaken, timeout = false) {
    this.gameInProgress = false;
    this.timerDisplay.stop();
    this.uiManager.setStartBattleState({ inProgress: false });
    this.boardRenderer.setAnalysisVisible(false);

    let dialogTitle = "";
    let dialogText = "";
    let onCloseCallback = null;

    if (timeout) {
      if (!playerWon) {
        this.playerState.takeDamage(damageTaken);
        if (this.playerState.isDefeated()) {
          dialogTitle = "Game Over";
          dialogText = `Time's up! You survived to Round ${this.playerState.level}.`;
          onCloseCallback = () => location.reload();
        } else {
          dialogTitle = "Round Lost";
          dialogText = `Time's up! Took ${damageTaken} damage.`;
        }
      } else {
        dialogTitle = "Round Won";
        dialogText = "Time's up! Black lost on time. You won the round!";
      }
    } else if (!playerWon && damageTaken > 0) {
      this.playerState.takeDamage(damageTaken);
      if (this.playerState.isDefeated()) {
        dialogTitle = "Game Over";
        dialogText = `Your HP dropped to 0! You survived to Round ${this.playerState.level}.`;
        onCloseCallback = () => location.reload();
      } else {
        dialogTitle = "Round Lost";
        dialogText = `You lost round ${this.playerState.level}! Took ${damageTaken} damage.`;
      }
    } else if (playerWon) {
      dialogTitle = "Victory!";
      dialogText = `You won round ${this.playerState.level}!`;
    } else {
      dialogTitle = "Draw";
      dialogText = "Round ended in a draw!";
    }

    this.uiManager.showDialog(dialogTitle, dialogText, onCloseCallback);
    this.playerState.advanceRound();
    this.combatRecord.snapshotBattleEnd(this.board.snapshot());

    const toRemove = [];
    this.board.forEach((entry, squareId) => {
      const isPlayerBench =
        squareId.startsWith("bench") && entry.color === this.playerColor;
      if (!isPlayerBench) toRemove.push(squareId);
    });
    toRemove.forEach((squareId) => {
      const piece = this.board.get(squareId);
      if (piece?.root) piece.root.setEnabled(false);
      this.board.delete(squareId);
    });

    this.preCombatPlayerState.forEach(({ squareId, type }) => {
      this.boardRenderer.placePiece(squareId, `${this.playerColor}-${type}`, {
        trackInventory: false,
        playSound: false,
      });
    });
    this.boardRenderer.updateAnalysisBar();

    this.onRoundEnd?.({ playerWon, damageTaken });
  }

  checkFinalWinner() {
    let whiteAlive = false;
    let blackAlive = false;

    this.board.forEach((entry, squareId) => {
      if (squareId.startsWith("bench")) return;
      if (entry.color === "white") whiteAlive = true;
      if (entry.color === "black") blackAlive = true;
    });

    if (!whiteAlive && !blackAlive) this.endCombat(false, 0);
    else if (!whiteAlive) {
      let blackValue = 0;
      this.board.forEach((entry, squareId) => {
        if (entry.color === "black" && !squareId.startsWith("bench")) {
          blackValue += entry.value;
        }
      });
      this.endCombat(this.playerColor === "black", blackValue);
    } else if (!blackAlive) {
      this.endCombat(this.playerColor === "white", 0);
    }
  }

  resolveAnnihilation() {
    let whiteValue = 0;
    let blackValue = 0;
    this.board.forEach((entry, squareId) => {
      if (squareId.startsWith("bench")) return;
      if (entry.color === "white") whiteValue += entry.value;
      else blackValue += entry.value;
    });

    if (whiteValue === 0 && blackValue === 0) this.endCombat(false, 0);
    else if (whiteValue === 0) this.endCombat(this.playerColor === "black", blackValue);
    else if (blackValue === 0) this.endCombat(this.playerColor === "white", 0);
    else if (whiteValue >= blackValue) this.endCombat(this.playerColor === "white", 0);
    else this.endCombat(this.playerColor === "black", blackValue - whiteValue);
  }

  requestEngineMove() {
    if (!this.gameInProgress) return;
    this.moveStartTime = Date.now();
    const historyStr =
      this.moveHistory.length > 0 ? ` moves ${this.moveHistory.join(" ")}` : "";
    this.engineClient.requestMove(
      `position fen ${this.initialFen}${historyStr}`,
      "go movetime 3900",
    );
  }

  initEngine() {
    this.engineClient.onLine = (line) => {
      if (!line.includes("score ")) return;
      const match = line.match(/score (cp|mate) (-?\d+)/);
      if (!match) return;

      let value = Number(match[2]);
      if (this.currentTurn === "black") value *= -1;
      this.lastEvalScore = { type: match[1], value };
      this.boardRenderer.setLastEvalScore(this.lastEvalScore);
    };

    this.engineClient.onBestMove = (move) => {
      const elapsed = Date.now() - this.moveStartTime;
      const delay = Math.max(0, 4000 - elapsed);

      if (move && move !== "(none)" && move !== "null") {
        setTimeout(() => this.executeEngineMove(move), delay);
        return;
      }
      setTimeout(() => this.resolveAnnihilation(), delay);
    };
  }

  executeEngineMove(move) {
    const result = this.#applyMoveLogic(move);
    if (!result) return;

    if (result.desync) {
      if (this.gameInProgress && this.desyncRetries < this.MAX_DESYNC_RETRIES) {
        this.desyncRetries += 1;
        this.initialFen = this.generateFEN(this.board.snapshot(), this.currentTurn);
        this.moveHistory = [];
        this.requestEngineMove();
        return;
      }
      this.resolveAnnihilation();
      return;
    }

    this.boardRenderer.applyMoveVisuals(result);
    this.moveHistory.push(move);
    this.combatRecord.push(result);
    this.uiManager.updatePlaybackUI(
      this.combatRecord.currentPlyIndex,
      this.combatRecord.length,
      this.combatRecord.isReviewing,
    );
    this.desyncRetries = 0;

    this.currentTurn = this.currentTurn === "white" ? "black" : "white";
    this.timerDisplay.setActiveTurn(this.currentTurn);

    if (this.noMoveCount >= 20) {
      this.uiManager.showToast(
        "Battle stagnated! Resolving based on surviving material...",
      );
      this.resolveAnnihilation();
      return;
    }

    this.checkFinalWinner();
    if (this.gameInProgress) this.requestEngineMove();
  }

  #applyMoveLogic(move) {
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const fromCoord = this.#fromAlgebraic(from);
    const toCoord = this.#fromAlgebraic(to);
    const fromSq = `${fromCoord.row}-${fromCoord.col}`;
    const toSq = `${toCoord.row}-${toCoord.col}`;
    const piece = this.board.get(fromSq);

    if (!piece) {
      return { desync: true };
    }

    const historyRecord = {
      move,
      fromSq,
      toSq,
      pieceMoved: piece,
      capturedPiece: null,
      enPassantSq: null,
      promotionInfo: null,
      sound: "move",
    };
    let capturedPiece = false;

    if (piece.type === "pawn" && fromCoord.col !== toCoord.col && !this.board.has(toSq)) {
      const epSq = `${fromCoord.row}-${toCoord.col}`;
      if (this.board.has(epSq)) {
        historyRecord.enPassantSq = epSq;
        historyRecord.capturedPiece = this.boardRenderer.removePiece(epSq, true, true);
        capturedPiece = true;
      }
    }

    if (this.board.has(toSq)) {
      historyRecord.capturedPiece = this.boardRenderer.removePiece(toSq, true, true);
      capturedPiece = true;
    }

    this.noMoveCount = piece.type === "pawn" || capturedPiece ? 0 : this.noMoveCount + 1;

    this.board.delete(fromSq);
    this.board.set(toSq, piece);

    if (move.length > 4) {
      const newType = PROMOTION_MAP[move[4].toLowerCase()] || "queen";
      historyRecord.promotionInfo = {
        oldType: piece.type,
        oldValue: piece.value,
        oldRoot: piece.root,
        newRoot: null,
        newType,
      };
      piece.type = newType;
      piece.value = this.pieceDefs[newType].value;
      historyRecord.sound = "promote";
    } else if (capturedPiece) {
      historyRecord.sound = "capture";
    }

    return historyRecord;
  }

  #fromAlgebraic(square) {
    return {
      col: square.charCodeAt(0) - 97,
      row: 8 - parseInt(square[1], 10),
    };
  }
}
