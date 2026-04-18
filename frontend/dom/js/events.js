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
    
    mainBtn.addEventListener('click', () => {
        gameState.linesOfCode += gameState.linesPerClick;
        gameState.totalLinesOfCode += gameState.linesPerClick;
        updateDisplay(null, null); 
    });

    upgrades.forEach((upgrade, index) => {
        const btn = document.getElementById(`upgrade-${index}`);
        
        btn.addEventListener('click', () => {
            if (gameState.linesOfCode >= upgrade.currentCost) {
                gameState.linesOfCode -= upgrade.currentCost;
                
                // Route effect application based on upgrade taxonomy
                if (upgrade.type === 'click') {
                    gameState.linesPerClick += upgrade.boost;
                } else if (upgrade.type === 'passive') {
                    gameState.linesPerClick += (upgrade.boost * 0.1);
                } 
                // Note: 'synergy' type requires no static mutation here. 
                // It is dynamically evaluated in main.js based on upgrade.count.
                
                if (upgrade.isCloud) {
                    gameState.hasCloudModel = true;
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
