const API_BASE_URL = typeof window.API_BASE_URL === 'string' ? window.API_BASE_URL : '';
const API_URL = `${API_BASE_URL}/api/auth`;
let oauthGoogleClientId = typeof window.APP_CONFIG?.GOOGLE_CLIENT_ID === 'string' ? window.APP_CONFIG.GOOGLE_CLIENT_ID.trim() : '';

let isRegisterMode = false;

const authForm = document.getElementById('auth-form');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnSubmit = document.getElementById('btn-submit');
const btnToggle = document.getElementById('btn-toggle');
const btnGoogle = document.getElementById('btn-google');
const formTitle = document.getElementById('form-title');
const messageDiv = document.getElementById('message');

let googleSdkReady = false;
let googleTokenClient = null;

async function refreshGoogleClientIdFromBackend() {
  if (oauthGoogleClientId) return oauthGoogleClientId;

  try {
    const response = await fetch(`${API_URL}/oauth/google/config`);
    if (response.ok) {
      const data = await response.json();
      if (data?.configured && typeof data?.clientId === 'string' && data.clientId.trim()) {
        oauthGoogleClientId = data.clientId.trim();
      }
    }
  } catch (error) {
    console.error('Google config fetch error:', error);
  }

  return oauthGoogleClientId;
}

// Toggle entre connexion et inscription
btnToggle.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  
  if (isRegisterMode) {
    formTitle.textContent = 'INSCRIPTION';
    btnSubmit.textContent = 'CREER UN COMPTE';
    btnToggle.textContent = 'J\'AI DEJA UN COMPTE';
    usernameInput.placeholder = 'NOM D\'UTILISATEUR';
    if (emailInput) {
      emailInput.style.display = '';
      emailInput.required = true;
    }
    messageDiv.textContent = '';
    messageDiv.className = 'message';
  } else {
    formTitle.textContent = 'CONNEXION';
    btnSubmit.textContent = 'SE CONNECTER';
    btnToggle.textContent = 'CREER UN COMPTE';
    usernameInput.placeholder = 'NOM D\'UTILISATEUR OU EMAIL';
    if (emailInput) {
      emailInput.style.display = 'none';
      emailInput.required = false;
      emailInput.value = '';
    }
    messageDiv.textContent = '';
    messageDiv.className = 'message';
  }
});

// Gérer la soumission du formulaire
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = usernameInput.value.trim();
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput.value.trim();
  
  if (!username || !password || (isRegisterMode && !email)) {
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
        identifier: username,
        password,
        email: isRegisterMode ? email : undefined
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

async function loginWithProvider(provider, token, tokenType = 'idToken') {
  const requestBody = tokenType === 'accessToken'
    ? { accessToken: token }
    : { idToken: token };

  try {
    const response = await fetch(`${API_URL}/oauth/${provider}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || `Erreur OAuth ${provider}`, 'error');
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showMessage(data.message || 'Connexion reussie', 'success');

    setTimeout(() => {
      window.location.href = 'home.html';
    }, 800);
  } catch (error) {
    console.error(`${provider} oauth fetch error:`, error);
    showMessage('Erreur de connexion OAuth au serveur', 'error');
  }
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.google?.accounts) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Script load error')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function initGoogleOAuth() {
  await refreshGoogleClientIdFromBackend();

  if (!oauthGoogleClientId) return;

  try {
    await loadScript('https://accounts.google.com/gsi/client');

    if (!window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: oauthGoogleClientId,
      callback: async (response) => {
        if (!response?.credential) {
          showMessage('Token Google manquant.', 'error');
          return;
        }
        await loginWithProvider('google', response.credential, 'idToken');
      }
    });

    if (window.google.accounts.oauth2?.initTokenClient) {
      googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: oauthGoogleClientId,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (!tokenResponse?.access_token) {
            showMessage('Connexion Google annulee.', 'error');
            return;
          }

          await loginWithProvider('google', tokenResponse.access_token, 'accessToken');
        }
      });
    }

    googleSdkReady = true;
  } catch (error) {
    console.error('Google SDK load error:', error);
  }
}

async function startGoogleLogin() {
  await refreshGoogleClientIdFromBackend();

  if (!oauthGoogleClientId) {
    showMessage('Google OAuth non configure (GOOGLE_CLIENT_ID).', 'error');
    return;
  }

  if (!googleSdkReady || !window.google?.accounts?.id) {
    await initGoogleOAuth();
  }

  if (!googleSdkReady || !window.google?.accounts?.id) {
    showMessage('Google SDK non charge. Reessayez dans quelques secondes.', 'error');
    return;
  }

  if (googleTokenClient?.requestAccessToken) {
    googleTokenClient.requestAccessToken({ prompt: 'select_account' });
    return;
  }

  window.google.accounts.id.prompt((notification) => {
    if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
      showMessage('Impossible d\'ouvrir la popup Google. Autorisez les popups/cookies puis reessayez.', 'error');
    }
  });
}

if (btnGoogle) {
  btnGoogle.addEventListener('click', startGoogleLogin);
}

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
    return;
  }

  initGoogleOAuth();

  // Gérer le lien JEUX - vérifier l'authentification
  const navJeux = document.getElementById('nav-jeux');
  if (navJeux) {
    navJeux.addEventListener('click', (e) => {
      e.preventDefault();
      const token = localStorage.getItem('token');
      if (token) {
        window.location.href = 'games.html';
      } else {
        showMessage('Connectez-vous pour accéder aux jeux', 'error');
      }
    });
  }
});
