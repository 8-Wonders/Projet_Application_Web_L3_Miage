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

    // 1. Compute Base Vendor Synergy Multiplier (Linear 1% per unit owned)
    let synergyMultiplier = 1.0;
    for (const [company, count] of Object.entries(gameState.companies)) {
        if (company !== 'None' && count > 0) {
            synergyMultiplier += (count * 0.01); 
        }
    }

    // 2. Aggregate baseline passive yield AND Global Synergy modifiers
    let currentBaseLps = 0;
    let globalSynergyBonus = 0;

    upgrades.forEach(upg => {
        if (upg.count > 0) {
            if (upg.type === 'synergy') {
                // Senior Devs explicitly increase the overall synergy multiplier
                globalSynergyBonus += (upg.boost * upg.count);
            } else if (upg.type === 'passive') {
                if (upg.isCloud) {
                    if (gameState.aiCycleActive) {
                        currentBaseLps += (upg.boost * upg.count);
                    }
                } else {
                    currentBaseLps += (upg.boost * upg.count);
                }
            }
        }
    });

    // Apply the compound global synergy modifiers
    synergyMultiplier += globalSynergyBonus;
    
    // Resolve final yield metric
    const finalLps = currentBaseLps * synergyMultiplier;
    
    // Mutate primary state and lifetime accumulation tracker
    gameState.linesOfCode += finalLps;
    gameState.totalLinesOfCode += finalLps;
    
    updateDisplay(finalLps, synergyMultiplier);
}

/**
 * Initializes state architecture, listeners, and starts the simulation thread.
 */
function initGame() {
    initUI();
    setupEventListeners();
    updateDisplay(0, 1);
    
    setInterval(gameLoop, 1000);
}

initGame();
