import { describe, it, expect } from 'vitest';
import { isValidEmail } from '../validation.js';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
      expect(isValidEmail('user123@test-domain.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
    });

    it('should handle whitespace by trimming', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
      expect(isValidEmail('  invalid  ')).toBe(false);
    });

    it('should return false for null/undefined/empty', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
});
