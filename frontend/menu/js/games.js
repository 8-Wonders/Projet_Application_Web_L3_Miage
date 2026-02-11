// Vérifier si l'utilisateur est connecté
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    // Rediriger vers la page de connexion si pas de session
    window.location.href = 'index.html';
    return;
  }
});

// Gérer les boutons JOUER
const playButtons = document.querySelectorAll('.btn-play');
playButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const game = btn.getAttribute('data-game');
    
    // Redirection vers les jeux
    if (game === 'dom') {
      window.location.href = '../canvas/jeu.html';
    } else if (game === 'canvas') {
      window.location.href = '../canvas/jeu.html';
    } else if (game === 'babylone') {
      window.location.href = '../babylonjs/index.html';
    }
  });
});
