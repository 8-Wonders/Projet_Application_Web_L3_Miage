importScripts('stockfish.js');

// Helper to initialize the engine
async function initializeEngine() {
  // Pass the script location so threads can load it
  const config = {
    mainScriptUrlOrBlob: "stockfish.js"
  };

  let sf = Stockfish(config);
  
  // Handle if Stockfish() returns a Promise (some Emscripten builds)
  if (sf instanceof Promise) {
    sf = await sf;
  }
  
  // Handle if the module has a .ready Promise (standard Emscripten)
  if (sf.ready instanceof Promise) {
    await sf.ready;
  }

  // Now sf should be the initialized module
  if (sf.FS) {
    console.log("FS module found. Writing variants.ini...");
    try {
      // FIX: Use customPiece1, customPiece2... and standard Betza movement notation
      sf.FS.writeFile('/variants.ini', `
[mychess]
parent = chess
noking = true
customPiece1 = c:C:C
customPiece2 = w:W:FC
customPiece3 = a:A:BN
customPiece4 = h:H:RN
customPiece5 = z:Z:QN
pieceValue = p:100, r:500, n:300, b:300, q:900, k:1000, c:300, w:500, a:700, h:800, z:1200
`);
      console.log("variants.ini written successfully.");
      postMessage("log: variants.ini written");
    } catch (e) {
      console.error("Error writing variants.ini:", e);
      postMessage("error: " + e.toString());
    }
  } else {
    console.warn("FS module NOT found on Stockfish instance. Custom variants might fail.");
    postMessage("error: FS module not found");
  }

  // Setup listeners
  sf.addMessageListener((line) => {
    postMessage(line);
  });

  onmessage = (e) => {
    console.log("Worker received:", e.data);
    sf.postMessage(e.data);
  };
  
  postMessage('ready');
}

initializeEngine().catch(err => {
  console.error("Failed to initialize engine:", err);
  postMessage("error: init failed " + err.toString());
});
