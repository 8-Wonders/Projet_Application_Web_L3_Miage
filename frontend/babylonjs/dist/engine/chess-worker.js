importScripts("stockfish.js");

async function initializeEngine() {
  const config = {
    mainScriptUrlOrBlob: "stockfish.js",
    preRun: [
      function () {
        try {
          FS.writeFile(
            "/variants.ini",
            `
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
customPiece9 = V:F
customPiece10 = T:WFN
customPiece11 = E:CZGH
customPiece12 = D:D
customPiece13 = Y:BW
customPiece14 = S:t[vWB]
customPiece15 = X:WF
pieceValue = P:100, R:500, N:300, B:300, Q:900, K:1000, C:300, W:300, A:700, H:800, Z:1200, I:500, F:0, M:500, V:100, T:600, E:500, D:200, Y:400, S:300, X:300
promotionPieceTypes = q r b n a h c w z i f m v t e d y s x
`
          );
          console.log("variants.ini successfully written during preRun.");
        } catch (err) {
          console.error("Failed to write variants.ini:", err);
        }
      },
    ],
  };

  let sf = Stockfish(config);

  if (sf instanceof Promise) sf = await sf;
  if (sf.ready instanceof Promise) await sf.ready;

  sf.addMessageListener((line) => {
    postMessage(line);
  });

  onmessage = (e) => {
    sf.postMessage(e.data);
  };

  postMessage("ready");
}

initializeEngine().catch((err) => {
  console.error("Failed to initialize engine:", err);
  postMessage("error: init failed " + err.toString());
});
