// Frontend/src/utils/logger.js

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  log: (message, ...args) => {
    if (isDevelopment) {
      console.log(`%c[LOG]%c ${new Date().toISOString()} - ${message}`, 'color: #1e88e5; font-weight: bold;', 'color: inherit;', ...args);
    }
  },
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(`%c[INFO]%c ${new Date().toISOString()} - ${message}`, 'color: #4CAF50; font-weight: bold;', 'color: inherit;', ...args);
    }
  },
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`%c[WARN]%c ${new Date().toISOString()} - ${message}`, 'color: #FFC107; font-weight: bold;', 'color: inherit;', ...args);
    }
  },
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(`%c[ERROR]%c ${new Date().toISOString()} - ${message}`, 'color: #D32F2F; font-weight: bold;', 'color: inherit;', ...args);
    }
  },
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.debug(`%c[DEBUG]%c ${new Date().toISOString()} - ${message}`, 'color: #9C27B0; font-weight: bold;', 'color: inherit;', ...args);
    }
  },
  event: (eventName, details = {}) => {
    if (isDevelopment) {
      console.log(`%c[EVENT]%c ${new Date().toISOString()} - ${eventName}:`, 'color: #FF9800; font-weight: bold;', 'color: inherit;', details);
    }
  }
};

export default logger;