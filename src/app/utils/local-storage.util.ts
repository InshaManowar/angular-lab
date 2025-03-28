/**
 * Utility functions for safely handling localStorage in SSR environments
 */

/**
 * Check if localStorage is available (won't be in SSR)
 */
export function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage !== undefined;
  } catch (e) {
    return false;
  }
}

/**
 * Safely get an item from localStorage, returns null if not available
 */
export function getLocalStorage(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    console.log('localStorage not available, cannot get:', key);
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return null;
  }
}

/**
 * Safely set an item in localStorage, returns false if it fails
 */
export function setLocalStorage(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) {
    console.log('localStorage not available, cannot set:', key);
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
    return false;
  }
}

/**
 * Safely remove an item from localStorage, returns false if it fails
 */
export function removeLocalStorage(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    console.log('localStorage not available, cannot remove:', key);
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
} 