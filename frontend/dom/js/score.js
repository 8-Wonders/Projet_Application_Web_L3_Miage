/**
 * @module score
 * @description Handles score submission to the backend API and manages the UI 
 * for the "Quit and Save Score" flow, including the overlay modal and game suspension.
 */

export class ScoreService {
    /**
     * Sends the final game score to the backend.
     * @param {string} username - The player's identifier.
     * @param {number} score - The calculated score (characters currently shown in the IDE).
     * @param {string} game - The game identifier (defaults to 'clicker').
     * @returns {Promise<{success: boolean, error?: any, data?: any}>}
     */
    static async submit(username, score, game = 'clicker') {
        try {
            // Retrieves the JWT if the user is authenticated via localStorage
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

/**
 * Bootstraps the UI for the scoring system.
 * Injects the "Quit & Save Score" button and the end-game modal into the DOM.
 */
export function initScoreUI() {
	// 1. Generate and inject the Top-Right Quit Button
    const quitBtn = document.createElement('button');
    
    // Injecting a clean "Save" SVG icon
    quitBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
    `;
    
    quitBtn.title = "Quit & Save Score"; 
    
    // Updated styling: Dark red and relative positioning adjustments
    quitBtn.style.cssText = `
		position: absolute;
        top: 5px;      /* Changed from 15px to move it UP */
        right: 10px;   /* Changed from 15px to move it LEFT */
        width: 45px;
        height: 45px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #8b0000;
        color: #f8f8f2;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        transition: transform 0.1s, background-color 0.2s;
    `;
    
    // Hover states for the darker theme
    quitBtn.onmouseover = () => quitBtn.style.backgroundColor = '#a50000'; // Slightly brighter dark red
    quitBtn.onmouseout = () => quitBtn.style.backgroundColor = '#8b0000';
    quitBtn.onmousedown = () => quitBtn.style.transform = 'scale(0.90)';
    quitBtn.onmouseup = () => quitBtn.style.transform = 'scale(1)';

    // FIX LAYOUT BUG: Anchor the button to the Upgrades section
    const upgradesSection = document.querySelector('.upgrades-section');
    upgradesSection.style.position = 'relative'; 
    
    // Prevent the H2 text from overlapping the button on small screens
    const h2 = upgradesSection.querySelector('h2');
    if (h2) {
        h2.style.paddingRight = '60px'; 
        h2.style.paddingLeft = '60px'; // Keeps the text visually centered
    }

    upgradesSection.appendChild(quitBtn);

    // 2. Generate and inject the Modal Overlay (Hidden by default)
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85);
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        color: #f8f8f2;
        backdrop-filter: blur(4px);
    `;

    // Inner Modal Content
    modalOverlay.innerHTML = `
        <div style="background: var(--panel-bg, #282a36); padding: 40px; border-radius: 12px; text-align: center; border: 2px solid var(--accent, #bd93f9); max-width: 450px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
            <h2 style="color: var(--accent, #bd93f9); margin-top: 0; font-size: 2rem;">Simulation Halted</h2>
            <p style="color: var(--text-muted, #6272a4);">Your final IDE payload size:</p>
            <p><strong id="final-score" style="color: #50fa7b; font-size: 3rem;">0</strong> <span style="font-size: 1rem;">characters</span></p>
            
            <input type="text" id="score-username" placeholder="Enter Username..." style="
                width: 80%; padding: 12px; margin: 20px 0; 
                background: var(--bg-color, #1e1e2e); border: 1px solid var(--text-muted, #6272a4); 
                color: white; border-radius: 6px; text-align: center; font-family: inherit; font-size: 1rem;
            ">
            
            <br>
            <button id="submit-score-btn" style="
                padding: 12px 30px; background-color: #50fa7b; color: #282a36; 
                border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 1.1rem;
                transition: opacity 0.2s;
            ">Upload to Mainframe</button>
            <p id="score-status" style="margin-top: 20px; font-size: 0.9rem; min-height: 1.2em;"></p>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    // 3. Bind Event Listeners for the UI flow
    quitBtn.addEventListener('click', () => {
        // "Exit" the game visually by overlaying the modal.
        // This blocks all underlying DOM interactions (upgrades, clicker).
        modalOverlay.style.display = 'flex';
        
        // Calculate the score: The explicit amount of characters currently rendered in the IDE.
        const ideCodeElement = document.getElementById('ide-code');
        const score = ideCodeElement ? ideCodeElement.innerText.length : 0;
        
        document.getElementById('final-score').innerText = score;
    });

    // 4. Handle API Submission
    const submitBtn = document.getElementById('submit-score-btn');
    submitBtn.addEventListener('click', async () => {
        const username = document.getElementById('score-username').value.trim();
        const statusText = document.getElementById('score-status');
        const score = parseInt(document.getElementById('final-score').innerText, 10);

        if (!username) {
            statusText.innerText = "Error: Username field cannot be empty.";
            statusText.style.color = "#ff5555"; // Red
            return;
        }

        // Pre-flight UI updates
        statusText.innerText = "Establishing connection...";
        statusText.style.color = "#f1fa8c"; // Yellow
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';

        // Dispatch to API
        const result = await ScoreService.submit(username, score, 'clicker');

        if (result.success) {
            statusText.innerText = "Payload accepted. Score saved successfully!";
            statusText.style.color = "#50fa7b"; // Green
            
            // Reload page after a brief delay to completely reset the session
            setTimeout(() => window.location.reload(), 2500);
        } else {
            statusText.innerText = result.error?.message || "Connection failed. Could not save score.";
            statusText.style.color = "#ff5555"; // Red
            
            // Re-enable button so player can try again
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
    });
}
