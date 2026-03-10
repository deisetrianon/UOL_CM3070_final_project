import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    onConsoleLog: (log, type) => {
      const message = log.toString();
      
      // Suppress expected errors
      if (type === 'error') {
        if (
          message.includes('useAuth must be used within an AuthProvider') ||
          message.includes('useDialog must be used within a DialogProvider') ||
          message.includes('not wrapped in act') ||
          message.includes('An update to') && message.includes('inside a test was not wrapped in act') ||
          message.includes('Deprecation warning') ||
          message.includes('Failed to parse URL') ||
          message.includes('Invalid URL') ||
          message.includes('The tag <') && message.includes('> is unrecognized') ||
          message.includes('is using incorrect casing') ||
          message.includes('Function components cannot be given refs')
        ) {
          return false; 
        }
      }
      
      // Suppress expected warnings
      if (type === 'warn') {
        if (
          message.includes('React Router Future Flag Warning') ||
          message.includes('v7_startTransition') ||
          message.includes('v7_relativeSplatPath') ||
          message.includes('not wrapped in act') ||
          message.includes('An update to') && message.includes('inside a test was not wrapped in act') ||
          message.includes('Deprecation warning') ||
          message.includes('The tag <') && message.includes('> is unrecognized') ||
          message.includes('is using incorrect casing') ||
          message.includes('Function components cannot be given refs')
        ) {
          return false;
        }
      }
      
      return true;
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/*.css',
        'dist/',
      ],
    },
  },
});
