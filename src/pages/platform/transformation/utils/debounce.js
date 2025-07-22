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
