/**
 * @module events
 * @description Ingress layer for all user interactions. Mutates state and orchestrates UI repaints.
 */

import { gameState } from './state.js';
import { upgrades } from './upgrades.js';
import { updateDisplay, updateUpgradeUI } from './ui.js';

/**
 * Binds input handlers to the DOM.
 */
export function setupEventListeners() {
    const mainBtn = document.getElementById('main-clicker');
    
    // Core manual generation event
    mainBtn.addEventListener('click', () => {
        gameState.linesOfCode += gameState.linesPerClick;
        // Fast-path DOM update: skips complex LPS/Synergy recalculations
        updateDisplay(null, null); 
    });

    // Transaction event listeners for the upgrade registry
    upgrades.forEach((upgrade, index) => {
        const btn = document.getElementById(`upgrade-${index}`);
        
        btn.addEventListener('click', () => {
            // Guard clause to ensure transaction validity
            if (gameState.linesOfCode >= upgrade.currentCost) {
                gameState.linesOfCode -= upgrade.currentCost;
                
                if (upgrade.type === 'click') {
                    gameState.linesPerClick += upgrade.boost;
                } else if (upgrade.type === 'passive') {
                    // Propagate 10% of passive yield scale into manual click yield
                    gameState.linesPerClick += (upgrade.boost * 0.1);
                }
                
                gameState.companies[upgrade.company]++;

                // Exponential cost scaling (base 1.15)
                upgrade.currentCost *= 1.15;
                upgrade.count += 1;

                updateUpgradeUI(index);
                updateDisplay(null, null);
            }
        });
    });
}
