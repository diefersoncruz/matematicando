import { supabase, handleSupabaseError } from './supabase.js';
import { userIdUtils } from '../utils/userIdUtils.js';
import { userIdMigration } from '../utils/userIdMigration.js';
import { secureStorage } from '../utils/secureStorage.js';

export const userRoomService = {
  // Get all rooms for the current user
  async getUserRooms() {
    try {
      const userId = userIdUtils.ensureConsistentUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get username for migration
      const currentUser = secureStorage.getItem('currentUser');
      const username = currentUser?.username || 'unknown';

      // Check if migration is needed and perform it
      const migrationNeeded = await userIdMigration.needsMigration(userId, username);
      
      if (migrationNeeded) {
        const migrationSuccess = await userIdMigration.autoMigrateIfNeeded(userId, username);
        
        if (!migrationSuccess) {
          console.warn('Auto-migration failed, user may need manual intervention');
        }
      }


      // First get user's room associations
      const { data: userRoomData, error: userRoomError } = await supabase
        .from('user_rooms')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_accessed', { ascending: false });

      if (userRoomError) throw userRoomError;

      if (!userRoomData || userRoomData.length === 0) {
        return [];
      }


      // Get room details for each room
      const roomIds = userRoomData.map(ur => ur.sala_id);
      
      const { data: roomsData, error: roomsError } = await supabase
        .from('salas')
        .select('id, nome, tipo, descricao, data_expiracao, capacidade, created_by')
        .in('id', roomIds);

      if (roomsError) throw roomsError;

      // Combine the data and identify orphaned associations
      const combinedData = userRoomData.map(userRoom => {
        const room = roomsData.find(r => r.id === userRoom.sala_id);
        return {
          ...userRoom,
          salas: room || null,
          isOrphaned: !room // Mark as orphaned if room not found
        };
      });
      
      // Clean up orphaned associations (rooms that don't exist anymore)
      const orphanedAssociations = combinedData.filter(item => item.isOrphaned);
      if (orphanedAssociations.length > 0) {
        
        // Delete orphaned associations
        const orphanedIds = orphanedAssociations.map(item => item.id);
        const { error: deleteError } = await supabase
          .from('user_rooms')
          .delete()
          .in('id', orphanedIds);
          
        if (deleteError) {
          console.error('Error cleaning up orphaned associations:', deleteError);
        }
      }
      
      // Return only valid rooms (not orphaned)
      const validRooms = combinedData.filter(item => !item.isOrphaned);
      
      return validRooms;
    } catch (error) {
      console.error('Error fetching user rooms:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Join a room
  async joinRoom(salaId, role = 'admin') {
    try {
      // Get consistent user ID
      const userId = userIdUtils.ensureConsistentUserId();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }


      const { data, error } = await supabase
        .from('user_rooms')
        .upsert({
          user_id: userId,
          sala_id: salaId,
          role: role,
          last_accessed: new Date().toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        // Handle 409 conflict (duplicate) gracefully
        if (error.code === '409' || error.code === 'PGRST116') {
          // Try to update the existing record
          const { data: updateData, error: updateError } = await supabase
            .from('user_rooms')
            .update({
              last_accessed: new Date().toISOString(),
              is_active: true
            })
            .eq('user_id', userId)
            .eq('sala_id', salaId)
            .select()
            .single();
          
          if (updateError) {
            throw updateError;
          }
          return updateData;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error joining room:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Leave a room
  async leaveRoom(salaId) {
    try {
      const currentUser = secureStorage.getItem('currentUser');
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_rooms')
        .update({ is_active: false })
        .eq('user_id', currentUser.id)
        .eq('sala_id', salaId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error leaving room:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update last accessed time
  async updateRoomAccess(salaId) {
    try {
      const currentUser = secureStorage.getItem('currentUser');
      if (!currentUser) {
        return; // Silently fail if not authenticated
      }

      const { error } = await supabase
        .from('user_rooms')
        .update({ last_accessed: new Date().toISOString() })
        .eq('user_id', currentUser.id)
        .eq('sala_id', salaId)
        .eq('is_active', true);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating room access:', error);
      // Don't throw error for this non-critical operation
      return false;
    }
  },

  // Check if user is member of room
  async isRoomMember(salaId) {
    try {
      const currentUser = secureStorage.getItem('currentUser');
      if (!currentUser) {
        return false;
      }

      const { data, error } = await supabase
        .from('user_rooms')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('sala_id', salaId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking room membership:', error);
      return false;
    }
  },

  // Get user's role in room
  async getUserRoleInRoom(salaId) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        return null;
      }

      const { data, error } = await supabase
        .from('user_rooms')
        .select('role')
        .eq('user_id', currentUser.id)
        .eq('sala_id', salaId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data ? data.role : null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  // Get room statistics for user
  async getUserRoomStats() {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        return null;
      }

      // Get all user room associations with room details to check for orphaned entries
      const { data: userRoomData, error: userRoomError } = await supabase
        .from('user_rooms')
        .select('id, role, joined_at, last_accessed, sala_id')
        .eq('user_id', currentUser.id)
        .eq('is_active', true);

      if (userRoomError) throw userRoomError;

      if (!userRoomData || userRoomData.length === 0) {
        return {
          totalRooms: 0,
          adminRooms: 0,
          memberRooms: 0,
          studentRooms: 0,
          lastJoined: null,
          lastAccessed: null
        };
      }

      // Check which rooms actually exist
      const roomIds = userRoomData.map(ur => ur.sala_id);
      const { data: existingRooms, error: roomsError } = await supabase
        .from('salas')
        .select('id')
        .in('id', roomIds);

      if (roomsError) throw roomsError;

      const existingRoomIds = new Set(existingRooms.map(r => r.id));
      
      // Identify and clean up orphaned associations
      const orphanedAssociations = userRoomData.filter(ur => !existingRoomIds.has(ur.sala_id));
      if (orphanedAssociations.length > 0) {
        
        const orphanedIds = orphanedAssociations.map(item => item.id);
        const { error: deleteError } = await supabase
          .from('user_rooms')
          .delete()
          .in('id', orphanedIds);
          
        if (deleteError) {
          console.error('Error cleaning up orphaned associations in stats:', deleteError);
        }
      }

      // Calculate stats based only on valid rooms
      const validAssociations = userRoomData.filter(ur => existingRoomIds.has(ur.sala_id));
      
      const stats = {
        totalRooms: validAssociations.length,
        adminRooms: validAssociations.filter(r => r.role === 'admin').length,
        memberRooms: validAssociations.filter(r => r.role === 'member').length,
        studentRooms: validAssociations.filter(r => r.role === 'student').length,
        lastJoined: validAssociations.length > 0 ? new Date(Math.max(...validAssociations.map(r => new Date(r.joined_at)))) : null,
        lastAccessed: validAssociations.length > 0 ? new Date(Math.max(...validAssociations.map(r => new Date(r.last_accessed)))) : null
      };

      return stats;
    } catch (error) {
      console.error('Error getting user room stats:', error);
      throw new Error(handleSupabaseError(error));
    }
  }
};
