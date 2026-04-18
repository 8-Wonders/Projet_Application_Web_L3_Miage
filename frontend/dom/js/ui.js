/**
 * @module ui
 * @description Handles all DOM traversal, node generation, and localized repaints.
 * Integrates a dynamic IDE string renderer based on underlying gamestate metrics.
 */

import { gameState } from './state.js';
import { upgrades } from './upgrades.js';
import { formatNumber } from './utils.js';

const refs = {
    locCount: document.getElementById('loc-count'),
    lpsCount: document.getElementById('lps-count'),
    lpcCount: document.getElementById('lpc-count'),
    upgradesContainer: document.getElementById('upgrades-container'),
    statusText: document.getElementById('status-text'),
    synergyText: document.getElementById('synergy-text'),
    
    ideEditor: document.getElementById('ide-editor'),
    ideCode: document.getElementById('ide-code'),
    ideLines: document.getElementById('ide-line-numbers')
};

const IDE_TEMPLATE = `import { QuantumEngine } from '@core/physics';
import { NetworkLayer } from '@core/net';

class GameInstance {
    constructor(config) {
        this.id = crypto.randomUUID();
        this.status = 'INITIALIZING';
        this.players = new Map();
        this.engine = new QuantumEngine(config);
    }

    async bootSequence() {
        console.log(\`Booting instance \${this.id}...\`);
        try {
            await this.engine.warmup();
            this.status = 'ONLINE';
            this.acceptConnections();
        } catch (error) {
            console.error('Fatal initialization failure:', error);
            process.exit(1);
        }
    }

    acceptConnections() {
        NetworkLayer.on('connect', (socket) => {
            if (this.players.size >= 100) {
                socket.disconnect('SERVER_FULL');
                return;
            }
            this.players.set(socket.id, new Player(socket));
        });
    }
}

// TODO: Optimize memory allocation
// TODO: Implement load balancing for AI workers
const server = new GameInstance({ latency: 'low' });
server.bootSequence();\n\n`;

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
        
        // Dynamically assign functional description based on entity type
        let effectText = `+${formatNumber(upgrade.boost)} LOC/click`;
        if (upgrade.type === 'passive') {
            const clickBonus = upgrade.boost * 0.1;
            effectText = `+${formatNumber(upgrade.boost)} LOC/sec`;
        } else if (upgrade.type === 'synergy') {
            effectText = `+${Math.round(upgrade.boost * 100)}% Global Synergy Multiplier`;
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
 * Triggers a repaint of the IDE visualizer based on historical LOC accumulation.
 * Safely guards against Infinity-based modulo NaN faults.
 */
function renderIDE() {
    let charsToShow = 0;
    
    // Guard Clause: Prevent Javascript Infinity from breaking the Modulo operator.
    // If the player somehow reaches 1.79e308 lines of code, fallback to max safe int.
    if (!Number.isFinite(gameState.totalLinesOfCode)) {
        charsToShow = Number.MAX_SAFE_INTEGER;
    } else if (gameState.totalLinesOfCode >= 10) {
        // Log2 generates the O(2^n) exponential progression scale
        charsToShow = Math.floor(Math.log2(gameState.totalLinesOfCode / 10)) + 1;
    }

    const renderLength = charsToShow % IDE_TEMPLATE.length;
    
    const currentCode = IDE_TEMPLATE.substring(0, renderLength);
    refs.ideCode.innerText = currentCode;

    const lineCount = (currentCode.match(/\n/g) || []).length + 1;
    let lineString = '';
    for (let i = 1; i <= lineCount; i++) {
        lineString += i + '<br>';
    }
    refs.ideLines.innerHTML = lineString;

    refs.ideEditor.scrollTop = refs.ideEditor.scrollHeight;
}

/**
 * Executes a batched repaint of the primary data displays.
 * @param {number|null} currentLps - Current effective passive yield.
 * @param {number|null} synergyMultiplier - Current vendor synergy multiplier.
 */
export function updateDisplay(currentLps, synergyMultiplier) {
    refs.locCount.innerText = formatNumber(gameState.linesOfCode);
    refs.lpcCount.innerText = formatNumber(gameState.linesPerClick);
    
    renderIDE();
    
    if (currentLps !== null) {
        refs.lpsCount.innerText = formatNumber(currentLps);
        
        if (refs.synergyText) {
            refs.synergyText.innerText = `Synergy Bonus: +${Math.floor((synergyMultiplier - 1) * 100)}%`;
        }
        
        if (refs.statusText) {
            if (gameState.hasCloudModel) {
                if (gameState.aiCycleActive) {
                    refs.statusText.innerText = `AI Compute Active (${gameState.aiCycleTimer}s)`;
                    refs.statusText.style.color = "lightgreen";
                } else {
                    refs.statusText.innerText = `Token Limit Reached! Resting... (${gameState.aiCycleTimer}s)`;
                    refs.statusText.style.color = "red";
                }
            } else {
                refs.statusText.innerText = '';
            }
        }
    }

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
