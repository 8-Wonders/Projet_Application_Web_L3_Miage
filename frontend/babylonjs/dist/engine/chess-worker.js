importScripts('stockfish.js');

async function initializeEngine() {
  const config = {
    mainScriptUrlOrBlob: "stockfish.js",
    preRun: [
      function() {
        try {
          // FS is available globally in Emscripten workers during preRun
          FS.writeFile('/variants.ini', `
[mychess]
parent = chess
noking = true
stalemateValue = loss
customPiece1 = C:C
customPiece2 = W:FC
customPiece3 = A:BN
customPiece4 = H:RN
customPiece5 = Z:QN
customPiece6 = I:mQ
customPiece7 = F:0
customPiece8 = M:KAD
pieceValue = P:100, R:500, N:300, B:300, Q:900, K:1000, C:300, W:300, A:700, H:800, Z:1200, I:500, F:0, M:500
promotionPieceTypes = q r b n a h c w z i f m
`);
          console.log("variants.ini successfully written during preRun.");
        } catch (err) {
          console.error("Failed to write variants.ini:", err);
        }
      }
    ]
  };

  let sf = Stockfish(config);
  
  if (sf instanceof Promise) {
    sf = await sf;
  }
  if (sf.ready instanceof Promise) {
    await sf.ready;
  }

  sf.addMessageListener((line) => {
    postMessage(line);
  });

  onmessage = (e) => {
    sf.postMessage(e.data);
  };
  
  postMessage('ready');
}

initializeEngine().catch(err => {
  console.error("Failed to initialize engine:", err);
  postMessage("error: init failed " + err.toString());
});
