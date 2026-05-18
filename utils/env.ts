/**
 * Universal environment checks to safely abstract `import.meta.env`
 * This ensures the shared workspace can be used in non-Vite environments
 * like Node.js unit tests or other tools without throwing reference errors.
 */

export const isDev = (): boolean => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.DEV === true;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  return false;
};

export const isProd = (): boolean => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.PROD === true;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'production';
  }
  return true; // Default to prod for safety
};
