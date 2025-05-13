// src/utils/config.js

/**
 * Gets a value from the config, with fallback if not found
 * 
 * @param {string} key - The config key to look up
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} The config value or default value
 */
export function getConfig(key, defaultValue = null) {
  if (!window.CONFIG) {
    console.warn('CONFIG not found in window object');
    return defaultValue;
  }
  
  return key in window.CONFIG ? window.CONFIG[key] : defaultValue;
}

/**
 * Gets a nested value from the config using dot notation
 * 
 * @param {string} path - The path to the config value (e.g. 'ICONS.FOLDER')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} The config value or default value
 */
export function getConfigPath(path, defaultValue = null) {
  if (!window.CONFIG) {
    console.warn('CONFIG not found in window object');
    return defaultValue;
  }
  
  const parts = path.split('.');
  let current = window.CONFIG;
  
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    
    current = current[part];
    
    if (current === undefined) {
      return defaultValue;
    }
  }
  
  return current;
}

/**
 * Gets all config values
 * 
 * @returns {Object} The entire config object
 */
export function getAllConfig() {
  return window.CONFIG || {};
}