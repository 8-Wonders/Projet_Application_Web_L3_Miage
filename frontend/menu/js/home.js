const API_URL = 'http://localhost:5001/api';
const DEFAULT_AVATAR = '/assets/img/pdp/pdp1.png';
const presetAvatars = [
  '/assets/img/pdp/pdp1.png',
  '/assets/img/pdp/pdp2.png',
  '/assets/img/pdp/pdp3.png',
  '/assets/img/pdp/pdp4.png',
  '/assets/img/pdp/pdp5.png',
  '/assets/img/pdp/pdp6.png',
  '/assets/img/pdp/pdp7.png',
  '/assets/img/pdp/pdp8.png',
  '/assets/img/pdp/pdp9.png'
];

// Vérifier si l'utilisateur est connecté
window.addEventListener('load', async () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    // Rediriger vers la page de connexion si pas de session
    window.location.href = 'index.html';
    return;
  }
  
  try {
    let userData = JSON.parse(user);

    // Récupérer le profil depuis l'API
    try {
      const profileResponse = await fetch(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData?.user) {
          userData = { ...userData, ...profileData.user };
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil API:', error);
    }
    
    // Afficher le message de bienvenue
    const welcomeMessage = document.getElementById('welcome-message');
    welcomeMessage.textContent = `BIENVENUE, ${userData.username.toUpperCase()}!`;

    // Afficher l'avatar enregistré
    const avatarImg = document.getElementById('profile-avatar');
    const avatarPicker = document.getElementById('avatar-picker');
    const btnConfirmAvatar = document.getElementById('btn-confirm-avatar');
    if (avatarImg) {
      const savedAvatar = userData.avatar || DEFAULT_AVATAR;
      const isAbsolute = savedAvatar.startsWith('http');
      const isUploadPath = savedAvatar.startsWith('/uploads/');
      avatarImg.src = isAbsolute ? savedAvatar : (isUploadPath ? `http://localhost:5001${savedAvatar}` : savedAvatar);
    }

    // Afficher la grille d'avatars prédéfinis
    if (avatarPicker) {
      avatarPicker.innerHTML = presetAvatars.map((src) => `
        <button class="avatar-option" type="button" data-avatar="${src}">
          <img src="${src}" alt="Avatar">
        </button>
      `).join('');

      let selectedPresetAvatar = null;

      avatarPicker.querySelectorAll('.avatar-option').forEach((btn) => {
        btn.addEventListener('click', () => {
          const avatar = btn.getAttribute('data-avatar');
          if (!avatar) return;

          selectedPresetAvatar = avatar;
          avatarPicker.querySelectorAll('.avatar-option').forEach((opt) => {
            opt.classList.remove('selected');
          });
          btn.classList.add('selected');

          if (btnConfirmAvatar) {
            btnConfirmAvatar.classList.add('active');
          }
        });
      });

      if (btnConfirmAvatar) {
        btnConfirmAvatar.addEventListener('click', async () => {
          if (!selectedPresetAvatar) return;

          try {
            const response = await fetch(`${API_URL}/users/me/avatar/preset`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ avatar: selectedPresetAvatar })
            });

            const data = await response.json();
            if (!response.ok) {
              console.error('Erreur avatar preset:', data?.message || 'Erreur');
              return;
            }

            const updatedUser = data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));

            if (avatarImg) {
              avatarImg.src = selectedPresetAvatar;
            }

            avatarPicker.classList.remove('active');
            btnConfirmAvatar.classList.remove('active');
            selectedPresetAvatar = null;
          } catch (error) {
            console.error('Erreur lors du changement d\'avatar:', error);
          }
        });
      }
    }
    
    // Afficher les meilleurs scores par jeu
    const bestScoresList = document.getElementById('best-scores-list');
    if (bestScoresList) {
      bestScoresList.innerHTML = `
        <p>DOM: ${userData.scores?.dom || 0}</p>
        <p>CANVAS: ${userData.scores?.canvas || 0}</p>
        <p>BABYLONE: ${userData.scores?.babylone || 0}</p>
      `;
    }
    
    // Afficher le temps de jeu par jeu
    const playtimeList = document.getElementById('playtime-list');
    if (playtimeList) {
      playtimeList.innerHTML = `
        <p>DOM: ${userData.playtime?.dom || 0}H</p>
        <p>CANVAS: ${userData.playtime?.canvas || 0}H</p>
        <p>BABYLONE: ${userData.playtime?.babylone || 0}H</p>
      `;
    }
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error);
    window.location.href = 'index.html';
  }
});

// Gérer le bouton de déconnexion
const btnLogout = document.getElementById('btn-logout');
btnLogout.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});

// Gérer le bouton de changement de photo de profil
const btnChangeAvatar = document.getElementById('btn-change-avatar');
const avatarInput = document.getElementById('avatar-input');
const avatarOptions = document.getElementById('avatar-options');
const btnChoosePreset = document.getElementById('btn-choose-preset');
const btnChooseUpload = document.getElementById('btn-choose-upload');
const avatarPicker = document.getElementById('avatar-picker');
const btnConfirmAvatar = document.getElementById('btn-confirm-avatar');

if (btnChangeAvatar && avatarOptions) {
  btnChangeAvatar.addEventListener('click', () => {
    avatarOptions.classList.toggle('active');
    if (avatarPicker) {
      avatarPicker.classList.remove('active');
    }
    if (btnConfirmAvatar) {
      btnConfirmAvatar.classList.remove('active');
    }
  });
}

if (btnChoosePreset && avatarOptions && avatarPicker) {
  btnChoosePreset.addEventListener('click', () => {
    avatarOptions.classList.remove('active');
    avatarPicker.classList.toggle('active');
    if (btnConfirmAvatar && !avatarPicker.classList.contains('active')) {
      btnConfirmAvatar.classList.remove('active');
    }
  });
}

if (btnChooseUpload && avatarOptions && avatarInput) {
  btnChooseUpload.addEventListener('click', () => {
    avatarOptions.classList.remove('active');
    if (avatarPicker) {
      avatarPicker.classList.remove('active');
    }
    if (btnConfirmAvatar) {
      btnConfirmAvatar.classList.remove('active');
    }
    avatarInput.click();
  });
}

if (avatarInput) {
  avatarInput.addEventListener('change', async () => {
    const file = avatarInput.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Erreur upload avatar:', data?.message || 'Erreur');
        return;
      }

      const userData = data.user;
      localStorage.setItem('user', JSON.stringify(userData));

      const avatarImg = document.getElementById('profile-avatar');
      if (avatarImg && userData.avatar) {
        const isUploadPath = userData.avatar.startsWith('/uploads/');
        avatarImg.src = isUploadPath ? `http://localhost:5001${userData.avatar}` : userData.avatar;
      }
    } catch (error) {
      console.error('Erreur lors du changement de photo:', error);
    } finally {
      avatarInput.value = '';
    }
  });
}
