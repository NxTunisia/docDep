
// Safely handle process and import.meta.env for both Node and Browser environments
const getProcessEnv = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env : {};
  } catch {
    return {};
  }
};

const getImportMetaEnv = () => {
  try {
    // @ts-ignore
    return (import.meta && import.meta.env) ? import.meta.env : {};
  } catch {
    return {};
  }
};

const processEnv = getProcessEnv();
const metaEnv = getImportMetaEnv();

export const AUTH_CREDENTIALS = {
  // Use VITE_APP_USERNAME/PASSWORD from environment, or fallback to hardcoded
  username: metaEnv.VITE_APP_USERNAME || 'LaspirAd',
  password: metaEnv.VITE_APP_PASSWORD || 'LaspirAD191'
};

export const PLACEHOLDER_REGEX = /\{([a-zA-Z0-9_]+)\}/g;

// Use API_KEY from environment, or fallback to "TEST"
export const API_KEY = processEnv.API_KEY || metaEnv.API_KEY || "TEST";

