// Utility functions for handling user ID migration

import { supabase } from '@/services/supabase.js';

export const userIdMigration = {
  // Check if user needs migration (has old user_rooms but no current ones)
  async needsMigration(currentUserId, username) {
    try {
        
      // Check if user has any current room associations
      const { data: currentRooms, error: currentError } = await supabase
        .from('user_rooms')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('is_active', true);

      if (currentError) {
        console.error('Error checking current rooms:', currentError);
        return false;
      }


      // If user has current rooms, no migration needed
      if (currentRooms && currentRooms.length > 0) {
        return false;
      }

      // Check if there are any user_rooms entries at all (for migration)
      const { data: allRooms, error: allError } = await supabase
        .from('user_rooms')
        .select('*')
        .limit(10);

      if (allError) {
        console.error('Error checking all rooms:', allError);
        return false;
      }


      // If there are rooms but user has none, migration might be needed
      return (allRooms && allRooms.length > 0);
      
    } catch (error) {
      console.error('Error checking migration need:', error);
      return false;
    }
  },

  // Migrate existing room associations to current user ID
  async migrateUserId(currentUserId, username) {
    try {
  
      // Get all user_rooms entries that don't belong to current user
      const { data: otherUserRooms, error: otherError } = await supabase
        .from('user_rooms')
        .select('*')
        .neq('user_id', currentUserId);

      if (otherError) {
        console.error('Error getting other user rooms:', otherError);
        return false;
      }


      if (!otherUserRooms || otherUserRooms.length === 0) {
        return true;
      }

      // For this simple case, we'll migrate the first found room
      // In production, you'd want better logic to match the correct user
      const roomToMigrate = otherUserRooms[0];

      // Update the room to belong to current user
      const { data: updatedRoom, error: updateError } = await supabase
        .from('user_rooms')
        .update({
          user_id: currentUserId
        })
        .eq('id', roomToMigrate.id)
        .select()
        .single();

      if (updateError) {
        return false;
      }

      return true;
      
    } catch (error) {
      console.error('Error during migration:', error);
      return false;
    }
  },

  // Auto-migrate if needed
  async autoMigrateIfNeeded(currentUserId, username) {
    try {
      const needsMigration = await this.needsMigration(currentUserId, username);
      
      if (needsMigration) {
        console.log('User needs migration, starting auto-migration...');
        const migrationSuccess = await this.migrateUserId(currentUserId, username);
        
        if (migrationSuccess) {
                return true;
        } else {
          console.error('Auto-migration failed');
          return false;
        }
      }
      
      return true; // No migration needed
      
    } catch (error) {
      console.error('Error in auto-migration:', error);
      return false;
    }
  }
};
