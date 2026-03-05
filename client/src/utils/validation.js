/**
 * Validation utility functions.
 * Provides validation functions for common data types.
 * 
 * @module validation
 */

/**
 * Validates an email address format.
 * 
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email format is valid
 */
export function isValidEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

