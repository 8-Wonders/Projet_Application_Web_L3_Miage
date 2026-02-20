export class EngineClient {
  constructor(workerUrl) {
    this.workerUrl = workerUrl;
    this.worker = null;
    this.engineConfigured = false;
    this.waitingForEngine = false;
    this.onBestMove = null;
    this.onLine = null;
  }

  init() {
    if (this.worker) {
      return;
    }

    this.worker = new Worker(this.workerUrl);
    this.worker.onerror = (err) => {
      console.error("Worker Error:", err);
    };
    this.worker.onmessage = (e) => {
      const line = e.data;
      if (this.onLine) {
        this.onLine(line);
      }

      if (line === "ready") {
        this.worker.postMessage("uci");
      } else if (line === "uciok") {
        this.configureForBattle();
      } else if (line === "readyok") {
        this.engineConfigured = true;
        if (this.waitingForEngine) {
          this.waitingForEngine = false;
          if (this.onReady) {
            this.onReady();
          }
        }
      } else if (line.startsWith("bestmove")) {
        const move = line.split(" ")[1];
        if (this.onBestMove) {
          this.onBestMove(move);
        }
      }
    };
  }

  configureForBattle() {
    if (!this.worker) {
      return;
    }
    this.engineConfigured = false;
    this.worker.postMessage("setoption name UCI_Variant value mychess");
    this.worker.postMessage("ucinewgame");
    this.worker.postMessage("isready");
  }

  startBattle(onReady) {
    this.onReady = onReady;
    this.waitingForEngine = true;
    this.init();
    if (this.worker && this.engineConfigured) {
      this.waitingForEngine = false;
      if (this.onReady) {
        this.onReady();
      }
    } else if (this.worker) {
      this.configureForBattle();
    }
  }

  requestMove(positionCmd, searchCmd) {
    if (!this.worker) {
      return;
    }
    this.worker.postMessage(positionCmd);
    this.worker.postMessage(searchCmd);
  }
}
