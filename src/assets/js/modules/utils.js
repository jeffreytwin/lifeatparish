/**
 * Utility Functions
 */

/**
 * Format price value for display
 * @param {number} value - Price in thousands (e.g., 200 = $200K, 1000 = $1M)
 * @returns {string} Formatted price string
 */
export function formatPrice(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.0', '')}M`;
  }
  return `${value}K`;
}

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
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
