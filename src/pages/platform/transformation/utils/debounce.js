/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Immediate execution function for performance-critical operations
 * @param {Function} func - The function to execute
 * @returns {Function} - The function that executes immediately
 */
export function immediate(func) {
  return function executedFunction(...args) {
    func(...args);
  };
}

/**
 * Enhanced debounce for target mappings with immediate update for UI
 * @param {Function} func - The function to debounce
 * @param {number} wait - The delay in milliseconds
 * @returns {Function} - The debounced function with immediate feedback
 */
export function debounceTargetMapping(func, wait = 300) {
  let timeout;
  let lastArgs = null;

  return function executedFunction(...args) {
    lastArgs = args;

    // Provide immediate visual feedback
    if (typeof func.immediate === 'function') {
      func.immediate(...args);
    }

    // Still debounce the expensive operation
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (lastArgs) {
        func(...lastArgs);
        lastArgs = null;
      }
    }, wait);
  };
}
