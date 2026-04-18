/**
 * @module upgrades
 * @description Static registry of purchasable entities.
 * * @typedef {Object} Upgrade
 * @property {string} id - Unique identifier.
 * @property {string} name - Display name.
 * @property {('click'|'passive'|'synergy')} type - Yield classification (manual, event loop, or multiplier scale).
 * @property {string} company - Vendor classification used for standard linear synergy tracking.
 * @property {boolean} isCloud - If true, yield generation is throttled by the global aiCycle state.
 * @property {number} boost - The delta applied to the respective yield variable upon purchase.
 * @property {number} baseCost - Initial purchase cost.
 * @property {number} currentCost - Dynamically scaling cost (typically baseCost * 1.15^count).
 * @property {number} count - Total units owned.
 * @property {string} svg - Pre-rendered SVG string for the UI layer.
 */

export const upgrades = [
    { id: 'mech_kb', name: 'Mechanical Keyboard', type: 'click', company: 'Logitech', isCloud: false, boost: 1, baseCost: 15, currentCost: 15, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>' },
    { id: 'so_bot', name: 'Stack Overflow Bot', type: 'passive', company: 'Github', isCloud: false, boost: 1, baseCost: 100, currentCost: 100, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' },
    { id: 'dev_3rd', name: '3rd World Dev', type: 'passive', company: 'India', isCloud: false, boost: 5, baseCost: 500, currentCost: 500, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M18 21v-2a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v2"/></svg>' },
    
    { id: 'llama', name: 'Llama 3.2', type: 'passive', company: 'Meta', isCloud: false, boost: 12, baseCost: 1000, currentCost: 1000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#0668E1" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/></svg>' },
    { id: 'gemma', name: 'Gemma 4', type: 'passive', company: 'Google', isCloud: false, boost: 30, baseCost: 2000, currentCost: 2000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#DB4437" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>' },
    { id: 'sonnet', name: 'Claude 3.5 Sonnet', type: 'passive', company: 'Anthropic', isCloud: true, boost: 250, baseCost: 5000, currentCost: 5000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#D97757" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' },
    { id: 'qwen', name: 'Qwen-3 Coder', type: 'passive', company: 'Alibaba', isCloud: false, boost: 150, baseCost: 8000, currentCost: 8000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#FF6A00" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>' },
    { id: 'deepseek', name: 'DeepSeek R1', type: 'passive', company: 'DeepSeek', isCloud: true, boost: 500, baseCost: 15000, currentCost: 15000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#4C9EEA" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></svg>' },
    
    // --- NEW: Global Synergy Modifier ---
    { id: 'senior_dev', name: 'Senior Dev', type: 'synergy', company: 'None', isCloud: false, boost: 0.05, baseCost: 25000, currentCost: 25000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#F1C40F" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
    
    { id: 'gpt5', name: 'ChatGPT 5.2', type: 'passive', company: 'OpenAI', isCloud: true, boost: 4000, baseCost: 50000, currentCost: 50000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#10A37F" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
    { id: 'gemini', name: 'Gemini 3.1 Pro', type: 'passive', company: 'Google', isCloud: true, boost: 50000, baseCost: 400000, currentCost: 400000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>' },
    { id: 'opus', name: 'Claude 4.6 Opus', type: 'passive', company: 'Anthropic', isCloud: true, boost: 250000, baseCost: 1000000, currentCost: 1000000, count: 0, svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#D97757" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="3"/></svg>' }
];
