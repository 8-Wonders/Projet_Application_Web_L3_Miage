const API_BASE_URL = typeof window.API_BASE_URL === 'string' ? window.API_BASE_URL : '';
const API_URL = `${API_BASE_URL}/api`;
const GAME_LABELS = {
  dom: 'DOM',
  canvas: 'CANVAS',
  babylone: 'BABYLONE'
};

window.addEventListener('load', () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    window.location.href = 'index.html';
    return;
  }

  loadLeaderboard(user);
});

async function loadLeaderboard(userJson) {
  const rankingGeneralList = document.getElementById('ranking-general-list');
  const rankingGameList = document.getElementById('ranking-game-list');
  if (!rankingGeneralList || !rankingGameList) return;

  const currentUser = (() => {
    try {
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      return null;
    }
  })();

  try {
    const [generalScores, gameScores] = await Promise.all([
      fetchScores(),
      fetchScores('canvas')
    ]);

    renderRankingTable(rankingGeneralList, generalScores, currentUser, true);
    renderRankingTable(rankingGameList, gameScores, currentUser, false);

    const filterButtons = document.getElementById('ranking-filter-buttons');
    if (filterButtons) {
      filterButtons.querySelectorAll('.ranking-filter-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const selectedGame = button.getAttribute('data-game');
          if (!selectedGame) return;

          filterButtons.querySelectorAll('.ranking-filter-btn').forEach((btn) => btn.classList.remove('active'));
          button.classList.add('active');

          const scores = await fetchScores(selectedGame);
          renderRankingTable(rankingGameList, scores, currentUser, false);
        });
      });
    }
  } catch (error) {
    console.error('Erreur chargement classement:', error);
    rankingGeneralList.innerHTML = '<tr><td colspan="5" class="ranking-empty">IMPOSIBLE DE CHARGER LE CLASSEMENT</td></tr>';
    rankingGameList.innerHTML = '<tr><td colspan="4" class="ranking-empty">IMPOSIBLE DE CHARGER LE CLASSEMENT</td></tr>';
  }
}

async function fetchScores(game) {
  const url = game ? `${API_URL}/scores?game=${encodeURIComponent(game)}` : `${API_URL}/scores`;
  const response = await fetch(url);
  return response.ok ? await response.json() : [];
}

function renderRankingTable(container, scores, currentUser, showGameColumn) {
  if (!Array.isArray(scores) || scores.length === 0) {
    container.innerHTML = showGameColumn
      ? '<tr><td colspan="5" class="ranking-empty">AUCUN SCORE ENCORE ENREGISTRE</td></tr>'
      : '<tr><td colspan="4" class="ranking-empty">AUCUN SCORE ENCORE ENREGISTRE</td></tr>';
    return;
  }

  container.innerHTML = scores.map((entry, index) => {
    const isCurrentUser = currentUser?.username && currentUser.username === entry.username;
    const date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) : '---';
    const gameLabel = GAME_LABELS[entry.game] || 'CANVAS';

    return showGameColumn
      ? `
        <tr class="${isCurrentUser ? 'ranking-row-current' : ''}">
          <td>${index + 1}</td>
          <td>${entry.username}</td>
          <td>${gameLabel}</td>
          <td>${entry.score}</td>
          <td>${date}</td>
        </tr>
      `
      : `
        <tr class="${isCurrentUser ? 'ranking-row-current' : ''}">
          <td>${index + 1}</td>
          <td>${entry.username}</td>
          <td>${entry.score}</td>
          <td>${date}</td>
        </tr>
      `;
  }).join('');
}
