// Récupérer le canvas pour le damier aléatoire
const canvas = document.getElementById('random-checkerboard');
const ctx = canvas.getContext('2d');

// Ajuster la taille du canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawRandomCheckerboard();
}

// Dessiner le damier aléatoire
function drawRandomCheckerboard() {
    const colors = ['#2a1a5e', '#1a0d4a'];
    const tileSize = 40;
    
    for (let y = 0; y < canvas.height; y += tileSize) {
        for (let x = 0; x < canvas.width; x += tileSize) {
            // Choix aléatoire de la couleur
            const colorIndex = Math.random() > 0.5 ? 0 : 1;
            ctx.fillStyle = colors[colorIndex];
            ctx.fillRect(x, y, tileSize, tileSize);
        }
    }
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);