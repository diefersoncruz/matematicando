/**
 * Secure Storage Utility
 * Provides encrypted storage for sensitive data
 * Uses AES encryption for localStorage
 */

import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET || 'matematicando-default-key-change-in-production';

export const secureStorage = {
  /**
   * Encrypt and store data
   * @param {string} key - Storage key
   * @param {any} data - Data to encrypt and store
   */
  setItem(key, data) {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
      localStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('Error encrypting data:', error);
      return false;
    }
  },

  /**
   * Retrieve and decrypt data
   * @param {string} key - Storage key
   * @returns {any|null} Decrypted data or null if error
   */
  getItem(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      // Remove corrupted data
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * Remove encrypted item
   * @param {string} key - Storage key
   */
  removeItem(key) {
    localStorage.removeItem(key);
  },

  /**
   * Clear all encrypted data
   */
  clear() {
    // Only remove known sensitive keys
    const sensitiveKeys = ['currentUser', 'currentRoom', 'auth_token'];
    sensitiveKeys.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  hasItem(key) {
    return localStorage.getItem(key) !== null;
  }
};

/**
 * Migration function to encrypt existing plain data
 * Call this once during app initialization
 */
export const migrateToSecureStorage = () => {
  try {
    // Migrate current user
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && !localStorage.getItem('currentUser_encrypted')) {
      secureStorage.setItem('currentUser', JSON.parse(currentUser));
      localStorage.removeItem('currentUser');
      localStorage.setItem('currentUser_encrypted', 'true');
    }

    // Migrate current room
    const currentRoom = localStorage.getItem('currentRoom');
    if (currentRoom && !localStorage.getItem('currentRoom_encrypted')) {
      secureStorage.setItem('currentRoom', JSON.parse(currentRoom));
      localStorage.removeItem('currentRoom');
      localStorage.setItem('currentRoom_encrypted', 'true');
    }

    console.log('Storage migration completed');
  } catch (error) {
    console.error('Error during storage migration:', error);
  }
};
