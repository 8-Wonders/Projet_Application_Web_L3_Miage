// Gérer le lien ACCUEIL/PROFIL selon l'état de connexion
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const navHome = document.getElementById('nav-home');
  
  if (navHome) {
    if (token) {
      // Utilisateur connecté : afficher PROFIL et rediriger vers home.html
      navHome.textContent = 'PROFIL';
      navHome.href = 'home.html';
    } else {
      // Utilisateur non connecté : afficher ACCUEIL et rediriger vers index.html
      navHome.textContent = 'ACCUEIL';
      navHome.href = 'index.html';
    }
  }
});
