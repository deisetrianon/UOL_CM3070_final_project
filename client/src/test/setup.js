/**
 * Test setup file for Vitest. Configures the testing environment by:
 * - Setting up cleanup after each test
 * - Mocking browser APIs (matchMedia, IntersectionObserver, ResizeObserver)
 * - Suppressing expected console errors, warnings, and logs 
 * 
 * @module test/setup
 * @fileoverview Global test configuration and mocks
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

console.error = (...args) => {
  const message = args[0]?.toString() || '';
  const errorMessage = args[0]?.message || '';
  const errorString = JSON.stringify(args);
  const allArgsString = args.map(arg => String(arg)).join(' ');
  
  if (
    message.includes('useAuth must be used within an AuthProvider') ||
    message.includes('useDialog must be used within a DialogProvider') ||
    message.includes('not wrapped in act(...)') ||
    message.includes('When testing, code that causes React state updates should be wrapped into act') ||
    errorMessage.includes('useAuth must be used') ||
    errorMessage.includes('useDialog must be used') ||
    errorString.includes('useAuth must be used') ||
    errorString.includes('useDialog must be used') ||
    allArgsString.includes('not wrapped in act') ||
    allArgsString.includes('An update to') && allArgsString.includes('inside a test was not wrapped in act') ||
    message.includes('Deprecation warning: value provided is not in a recognized RFC2822 or ISO format') ||
    message.includes('Failed to parse URL') ||
    message.includes('Invalid URL') ||
    message.includes('Failed to parse URL') ||
    message.includes('Invalid URL') ||
    message.includes('Error fetching emails') || 
    message.includes('Error calling /api/test') ||
    message.includes('Error checking authentication') ||
    message.includes('The tag <') && message.includes('> is unrecognized in this browser') ||
    message.includes('is using incorrect casing')
  ) {
    return;
  }
  
  originalError(...args);
};

console.warn = (...args) => {
  const message = args[0]?.toString() || '';
  const allArgsString = args.map(arg => String(arg)).join(' ');
  
  if (
    message.includes('React Router Future Flag Warning') ||
    message.includes('v7_startTransition') ||
    message.includes('v7_relativeSplatPath') ||
    message.includes('not wrapped in act(...)') ||
    message.includes('When testing, code that causes React state updates should be wrapped into act') ||
    allArgsString.includes('not wrapped in act') ||
    allArgsString.includes('An update to') && allArgsString.includes('inside a test was not wrapped in act') ||
    message.includes('Deprecation warning') ||
    message.includes('The tag <') && message.includes('> is unrecognized in this browser') ||
    message.includes('is using incorrect casing') ||
    message.includes('Function components cannot be given refs')
  ) {
    return;
  }
  
  originalWarn(...args);
};

console.log = (...args) => {
  const message = args[0]?.toString() || '';
  const allArgsString = args.map(arg => String(arg)).join(' ');
  
  if (
    message.includes('[FacialAnalysis] Could not query camera permission') ||
    allArgsString.includes('[FacialAnalysis] Could not query camera permission') ||
    false
  ) {
    return;
  }
  
  originalLog(...args);
};
