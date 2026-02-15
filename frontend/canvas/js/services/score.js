export class ScoreService {
    /**
     * Sends the score to the backend.
     * @param {string} username 
     * @param {number} score 
     * @returns {Promise<{success: boolean, error?: any, data?: any}>}
     */
    static async submit(username, score) {
        try {
            const response = await fetch("http://localhost:3000/api/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    score, // Matches the backend expectation
                    timestamp: new Date().toISOString()
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
