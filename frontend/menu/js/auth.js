const API_URL = 'http://localhost:5001/api/auth';

let isRegisterMode = false;

const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnSubmit = document.getElementById('btn-submit');
const btnToggle = document.getElementById('btn-toggle');
const formTitle = document.getElementById('form-title');
const messageDiv = document.getElementById('message');

// Toggle entre connexion et inscription
btnToggle.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  
  if (isRegisterMode) {
    formTitle.textContent = 'INSCRIPTION';
    btnSubmit.textContent = 'CREER UN COMPTE';
    btnToggle.textContent = 'J\'AI DEJA UN COMPTE';
    messageDiv.textContent = '';
    messageDiv.className = 'message';
  } else {
    formTitle.textContent = 'CONNEXION';
    btnSubmit.textContent = 'SE CONNECTER';
    btnToggle.textContent = 'CREER UN COMPTE';
    messageDiv.textContent = '';
    messageDiv.className = 'message';
  }
});

// Gérer la soumission du formulaire
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!username || !password) {
    showMessage('Veuillez remplir tous les champs', 'error');
    return;
  }
  
  try {
    const endpoint = isRegisterMode ? '/register' : '/login';
    const response = await fetch(API_URL + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        email: isRegisterMode ? username + '@example.com' : undefined
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage(data.message || 'Erreur lors de l\'authentification', 'error');
      return;
    }
    
    // Succès
    showMessage(data.message, 'success');
    
    // Sauvegarder le token et les infos utilisateur
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Réinitialiser le formulaire
    authForm.reset();
    usernameInput.value = '';
    passwordInput.value = '';
    
    // Rediriger vers la page de profil après 1 seconde
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1000);
    
    // Ne pas rediriger, rester sur la page d'accueil
    
  } catch (error) {
    console.error('Erreur:', error);
    showMessage('Erreur de connexion au serveur', 'error');
  }
});

function showMessage(text, type) {
  messageDiv.textContent = text;
  messageDiv.className = `message ${type}`;
}

// Vérifier si l'utilisateur est déjà connecté
window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (token && user) {
    // Rediriger vers la page de profil
    window.location.href = 'home.html';
  }
});
