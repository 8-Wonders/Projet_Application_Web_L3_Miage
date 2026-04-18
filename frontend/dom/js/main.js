/**
 * @module main
 * @description The main execution context. Bootstraps the application and manages the primary heartbeat (game loop).
 */

import { gameState } from './state.js';
import { upgrades } from './upgrades.js';
import { initUI, updateDisplay } from './ui.js';
import { setupEventListeners } from './events.js';

/**
 * The core simulation tick. Executes mathematical aggregations for passive 
 * yields, processes state phase shifts (cloud throttling), and pushes to the view layer.
 */
function gameLoop() {
    // Process cyclic cloud service availability (10s intervals)
    gameState.aiCycleTimer--;
    if (gameState.aiCycleTimer <= 0) {
        gameState.aiCycleActive = !gameState.aiCycleActive;
        gameState.aiCycleTimer = 10;
    }

    // Compute vendor synergy multiplier (Linear 1% per unit owned)
    let synergyMultiplier = 1.0;
    for (const [company, count] of Object.entries(gameState.companies)) {
        if (company !== 'None' && count > 0) {
            synergyMultiplier += (count * 0.01); 
        }
    }

    // Aggregate baseline passive yield based on active state constraints
    let currentBaseLps = 0;
    upgrades.forEach(upg => {
        if (upg.type === 'passive' && upg.count > 0) {
            if (upg.isCloud) {
                if (gameState.aiCycleActive) {
                    currentBaseLps += (upg.boost * upg.count);
                }
            } else {
                currentBaseLps += (upg.boost * upg.count);
            }
        }
    });

    const finalLps = currentBaseLps * synergyMultiplier;
    gameState.linesOfCode += finalLps;
    
    updateDisplay(finalLps, synergyMultiplier);
}

/**
 * Initializes state architecture, listeners, and starts the simulation thread.
 */
function initGame() {
    initUI();
    setupEventListeners();
    updateDisplay(0, 1);
    
    // Primary execution thread: ~1 tick per second
    setInterval(gameLoop, 1000);
}

initGame();
