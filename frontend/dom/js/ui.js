/**
 * @module ui
 * @description Handles all DOM traversal, node generation, and localized repaints.
 * Relies strictly on data injected from the engine layer to maintain view-model separation.
 */

import { gameState } from './state.js';
import { upgrades } from './upgrades.js';
import { formatNumber } from './utils.js';

// DOM Node Cache
const refs = {
    locCount: document.getElementById('loc-count'),
    lpsCount: document.getElementById('lps-count'),
    lpcCount: document.getElementById('lpc-count'),
    upgradesContainer: document.getElementById('upgrades-container'),
    statusText: document.getElementById('status-text'),
    synergyText: document.getElementById('synergy-text')
};

/**
 * Bootstraps the upgrade interfaces based on the static upgrades registry.
 */
export function initUI() {
    refs.upgradesContainer.innerHTML = ''; 

    const fragment = document.createDocumentFragment();

    upgrades.forEach((upgrade, index) => {
        const btn = document.createElement('button');
        btn.className = 'upgrade-btn';
        btn.id = `upgrade-${index}`;
        btn.disabled = true;
        
        const burstTag = upgrade.isCloud ? '<span style="color:red; font-size: 0.7rem;"> [CLOUD]</span>' : '';
        
        let effectText = `+${formatNumber(upgrade.boost)} LOC/click`;
        if (upgrade.type === 'passive') {
            const clickBonus = upgrade.boost * 0.1;
            effectText = `+${formatNumber(upgrade.boost)} LOC/sec`;
        }
        
        btn.innerHTML = `
            <div class="upgrade-icon">${upgrade.svg}</div>
            <div class="upgrade-info">
                <span class="upgrade-name">${upgrade.name} ${burstTag}</span>
                <span style="font-size: 0.7rem; color: #aaa;">(${upgrade.company}) - Owned: <span id="count-${index}">0</span></span><br>
                <span class="upgrade-effect">${effectText}</span>
            </div>
            <div class="upgrade-cost" id="cost-${index}">${formatNumber(upgrade.currentCost)}</div>
        `;
        fragment.appendChild(btn);
    });

    refs.upgradesContainer.appendChild(fragment);
}

/**
 * Executes a batched repaint of the primary data displays.
 * * @param {number|null} currentLps - Current effective passive yield. Bypassed during manual click events to save compute.
 * @param {number|null} synergyMultiplier - Current vendor synergy multiplier.
 */
export function updateDisplay(currentLps, synergyMultiplier) {
    refs.locCount.innerText = formatNumber(gameState.linesOfCode);
    refs.lpcCount.innerText = formatNumber(gameState.linesPerClick);
    
    // Conditionally update game-loop specific metrics
    if (currentLps !== null) {
        refs.lpsCount.innerText = formatNumber(currentLps);
        
        if (refs.synergyText) {
            refs.synergyText.innerText = `Synergy Bonus: +${Math.floor((synergyMultiplier - 1) * 100)}%`;
        }
        
        if (refs.statusText) {
            if (gameState.aiCycleActive) {
                refs.statusText.innerText = `⚡ AI Compute Active (${gameState.aiCycleTimer}s)`;
                refs.statusText.style.color = "lightgreen";
            } else {
                refs.statusText.innerText = `🛑 Token Limit Reached! Resting... (${gameState.aiCycleTimer}s)`;
                refs.statusText.style.color = "red";
            }
        }
    }

    // Evaluate dynamic dismounts of disabled states based on current bank
    upgrades.forEach((upgrade, index) => {
        const btn = document.getElementById(`upgrade-${index}`);
        btn.disabled = gameState.linesOfCode < upgrade.currentCost;
    });
}

/**
 * Triggers a localized DOM update for a specific upgrade node upon transaction.
 * @param {number} index - Index reference of the purchased upgrade.
 */
export function updateUpgradeUI(index) {
    document.getElementById(`count-${index}`).innerText = formatNumber(upgrades[index].count);
    document.getElementById(`cost-${index}`).innerText = formatNumber(upgrades[index].currentCost);
}
