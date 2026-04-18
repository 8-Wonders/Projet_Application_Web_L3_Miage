/**
 * @module state
 * @description Centralized state management. Acts as the single source of truth 
 * for the application's data layer, keeping domain logic strictly decoupled from the DOM.
 */

export const gameState = {
    // Primary economic metrics
    linesOfCode: 0,
    
    // Used to prevent visual regressions (like the IDE text shrinking) during currency expenditure.
    totalLinesOfCode: 0, 
    
    linesPerClick: 1,
    unlockedUpgrades: [],
    
    // Global throttling mechanics (simulates cloud token availability)
    hasCloudModel: false, // NEW: Flags whether the cycle UI should be rendered to the DOM
    aiCycleActive: true,
    aiCycleTimer: 10,
    
    // Vendor registry for computing exponential synergy multipliers
    companies: {
        Meta: 0,
        Google: 0,
        Anthropic: 0,
        Alibaba: 0,
        DeepSeek: 0,
        OpenAI: 0,
        Logitech: 0,
        Github: 0,
        India: 0,
        None: 0
    }
};
