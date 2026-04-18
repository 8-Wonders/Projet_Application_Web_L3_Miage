/**
 * @module utils
 * @description Provides generic, stateless utility functions for the application.
 */

/**
 * Normalizes and formats a numeric value into a localized locale string.
 * Truncates floating-point values to ensure clean UI presentation, particularly 
 * after applying fractional multipliers (e.g., standard 1.15x cost scaling).
 *
 * @param {number} number - The raw numeric value.
 * @returns {string} The localized string representation with comma separators.
 */
export function formatNumber(number) {
    return Math.floor(number).toLocaleString('en-US');
}
