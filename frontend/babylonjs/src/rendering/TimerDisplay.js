export class TimerDisplay {
  constructor({ container = document.body } = {}) {
    this.container = container;
    this.timeWhite = 180;
    this.timeBlack = 180;
    this.currentTurn = "white";
    this.interval = null;

    this.rootEl = document.createElement("div");
    this.rootEl.id = "chess-timers";
    Object.assign(this.rootEl.style, {
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      display: "none",
      flexDirection: "row",
      gap: "12px",
      zIndex: "1000",
      fontFamily: "'Space Grotesk', monospace",
      fontSize: "20px",
      fontWeight: "600",
      pointerEvents: "none",
    });

    this.whiteTimerEl = this.#makeTimerEl("white");
    this.blackTimerEl = this.#makeTimerEl("black");
    this.rootEl.appendChild(this.whiteTimerEl);
    this.rootEl.appendChild(this.blackTimerEl);
    this.container.appendChild(this.rootEl);
    this.reset();
  }

  #makeTimerEl(color) {
    const el = document.createElement("div");
    Object.assign(el.style, {
      backgroundColor: "rgba(17, 24, 42, 0.85)",
      color: color === "white" ? "#e5e7ef" : "#8ea1c8",
      padding: "6px 14px",
      borderRadius: "12px",
      border: "1px solid #2a3555",
      backdropFilter: "blur(8px)",
      boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
    });
    el.innerText = "[03:00]";
    return el;
  }

  #formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  #updateText() {
    this.whiteTimerEl.innerText = this.#formatTime(Math.max(0, this.timeWhite));
    this.blackTimerEl.innerText = this.#formatTime(Math.max(0, this.timeBlack));
  }

  #updateVisuals() {
    this.whiteTimerEl.style.borderColor =
      this.currentTurn === "white" ? "#4c6fff" : "#2a3555";
    this.whiteTimerEl.style.color =
      this.currentTurn === "white" ? "#fff" : "#e5e7ef";
    this.blackTimerEl.style.borderColor =
      this.currentTurn === "black" ? "#4c6fff" : "#2a3555";
    this.blackTimerEl.style.color =
      this.currentTurn === "black" ? "#fff" : "#8ea1c8";
  }

  start(onWhiteTimeout, onBlackTimeout) {
    this.stop();
    this.reset();
    this.rootEl.style.display = "flex";
    this.interval = window.setInterval(() => {
      if (this.currentTurn === "white") this.timeWhite -= 1;
      else this.timeBlack -= 1;

      this.#updateText();

      if (this.timeWhite <= 0) {
        this.stop();
        onWhiteTimeout?.();
      } else if (this.timeBlack <= 0) {
        this.stop();
        onBlackTimeout?.();
      }
    }, 1000);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this.rootEl.style.display = "none";
  }

  reset() {
    this.timeWhite = 180;
    this.timeBlack = 180;
    this.currentTurn = "white";
    this.#updateText();
    this.#updateVisuals();
  }

  setActiveTurn(turn) {
    this.currentTurn = turn;
    this.#updateVisuals();
  }
}
