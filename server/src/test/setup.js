const originalConsole = { ...console };

global.console = {
  ...originalConsole,
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {},
};
