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
    return `$${(value / 1000).toFixed(1).replace('.0', '')}M`;
  }
  return `$${value}K`;
}

/**
 * Parse price string to numeric value
 * Handles formats: "$249,999", "$1.5M", "$2M", etc.
 * @param {string} priceString - Price string to parse
 * @returns {number|null} Numeric price value or null if invalid
 */
export function parsePrice(priceString) {
  if (!priceString || typeof priceString !== 'string') {
    return null;
  }

  // Remove $ and spaces
  let cleaned = priceString.replace(/\$|,|\s/g, '');

  // Check for M (millions) or K (thousands)
  if (cleaned.includes('M')) {
    const value = parseFloat(cleaned.replace('M', ''));
    return isNaN(value) ? null : value * 1000000;
  } else if (cleaned.includes('K')) {
    const value = parseFloat(cleaned.replace('K', ''));
    return isNaN(value) ? null : value * 1000;
  } else {
    // Plain number
    const value = parseFloat(cleaned);
    return isNaN(value) ? null : value;
  }
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


