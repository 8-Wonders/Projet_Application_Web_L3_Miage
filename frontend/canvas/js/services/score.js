export class ScoreService {
    /**
     * Sends the score to the backend.
     * @param {string} username 
     * @param {number} score 
     * @returns {Promise<{success: boolean, error?: any, data?: any}>}
     */
    static async submit(username, score, game = 'canvas') {
        try {
            const token = localStorage.getItem("token");
            const apiBaseUrl = typeof window.API_BASE_URL === "string" ? window.API_BASE_URL : "";

            if (!token) {
                return { success: false, error: { message: "Vous devez être connecté pour enregistrer un score." } };
            }

            const response = await fetch(`${apiBaseUrl}/api/scores`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    username,
                    score,
                    game
                })
            });

            if (!response.ok) {
                // Try to parse backend error message, fallback to generic object
                const errData = await response.json().catch(() => ({}));
                return { success: false, error: errData };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    }
}
