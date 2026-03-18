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
customPiece1 = c:C
customPiece2 = w:FC
customPiece3 = a:BN
customPiece4 = h:RN
customPiece5 = z:QN
customPiece6 = i:mQ
customPiece7 = f:0
customPiece8 = m:KAD
pieceValue = p:100, r:500, n:300, b:300, q:900, k:1000, c:300, w:500, a:700, h:800, z:1200, i:500, f:0, m:500
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
