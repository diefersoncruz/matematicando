// Utility functions for consistent user ID handling

import { secureStorage } from './secureStorage.js';

export const userIdUtils = {
  // Get current user ID with validation
  getCurrentUserId() {
    try {
      const currentUser = secureStorage.getItem('currentUser');
      if (!currentUser || !currentUser.id) {
        console.error('No current user or user ID found in secure storage');
        return null;
      }
      
      return currentUser.id;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  },

  // Validate user ID format
  validateUserId(userId) {
    if (!userId) {
      console.error('User ID is null or undefined');
      return false;
    }
    
    if (typeof userId !== 'string') {
      console.error('User ID is not a string:', typeof userId, userId);
      return false;
    }
    
    // Check if it's a valid UUID format (Supabase uses UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.warn('User ID does not match UUID format:', userId);
      // Still return true as it might be a valid ID in a different format
    }
    
    return true;
  },

  // Ensure user ID consistency
  ensureConsistentUserId() {
    const userId = this.getCurrentUserId();
    
    if (!userId) {
      console.error('Cannot ensure user ID consistency - no user ID found');
      return null;
    }
    
    if (!this.validateUserId(userId)) {
      console.error('Invalid user ID format:', userId);
      return null;
    }
    
    return userId;
  },

  // Debug user ID storage and retrieval
  debugUserIdStorage() {
  }
};
