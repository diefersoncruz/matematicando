import { supabase, handleSupabaseError } from './supabase.js';
import { userIdUtils } from '@/utils/userIdUtils.js';
import { userIdMigration } from '@/utils/userIdMigration.js';

export const userRoomService = {
  // Get all rooms for the current user
  async getUserRooms() {
    try {
      console.log('=== userRoomService.getUserRooms() debug start ===');
      
      // Debug user ID storage
      userIdUtils.debugUserIdStorage();
      
      // Get consistent user ID
      const userId = userIdUtils.ensureConsistentUserId();
      
      if (!userId) {
        console.log('No valid user ID found');
        throw new Error('User not authenticated');
      }

      console.log('Validated user ID:', userId);

      // Get username for migration
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const username = currentUser?.username || 'unknown';

      // Check if migration is needed and perform it
      console.log('=== Checking migration need ===');
      const migrationNeeded = await userIdMigration.needsMigration(userId, username);
      
      if (migrationNeeded) {
        console.log('Migration needed, attempting auto-migration...');
        const migrationSuccess = await userIdMigration.autoMigrateIfNeeded(userId, username);
        
        if (!migrationSuccess) {
          console.error('Auto-migration failed, but continuing with normal flow');
        }
      }

      // Debug: Check all user_rooms entries for this user (including inactive)
      console.log('=== Debug: Checking all user_rooms entries ===');
      const { data: allUserRooms, error: allUserRoomsError } = await supabase
        .from('user_rooms')
        .select('*')
        .eq('user_id', userId);
      
      console.log('All user_rooms for this user:', allUserRooms);
      console.log('All user_rooms error:', allUserRoomsError);
      
      // Debug: Check if there are any entries at all in user_rooms table
      const { data: allRooms, error: allRoomsError } = await supabase
        .from('user_rooms')
        .select('*')
        .limit(5);
      
      console.log('Sample user_rooms data:', allRooms);
      console.log('Sample user_rooms error:', allRoomsError);

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

      // Debug: Check if there are any rooms at all
      console.log('=== Debug: Checking salas table ===');
      const { data: allSalas, error: allSalasError } = await supabase
        .from('salas')
        .select('id, nome, created_by')
        .limit(5);
      
      console.log('Sample salas data:', allSalas);
      console.log('Sample salas error:', allSalasError);

      // Get room details for each room
      const roomIds = userRoomData.map(ur => ur.sala_id);
      console.log('Room IDs to fetch:', roomIds);
      
      const { data: roomsData, error: roomsError } = await supabase
        .from('salas')
        .select('id, nome, tipo, descricao, data_expiracao, capacidade, created_by')
        .in('id', roomIds);

      console.log('Rooms data from batch query:', roomsData);
      console.log('Rooms error from batch query:', roomsError);

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
      
      console.log('Combined data with orphaned check:', combinedData);
      
      // Clean up orphaned associations (rooms that don't exist anymore)
      const orphanedAssociations = combinedData.filter(item => item.isOrphaned);
      if (orphanedAssociations.length > 0) {
        console.log('Found orphaned associations, cleaning up:', orphanedAssociations);
        
        // Delete orphaned associations
        const orphanedIds = orphanedAssociations.map(item => item.id);
        const { error: deleteError } = await supabase
          .from('user_rooms')
          .delete()
          .in('id', orphanedIds);
          
        if (deleteError) {
          console.error('Error cleaning up orphaned associations:', deleteError);
        } else {
          console.log('Successfully cleaned up orphaned associations');
        }
      }
      
      // Return only valid rooms (not orphaned)
      const validRooms = combinedData.filter(item => !item.isOrphaned);
      console.log('Final valid rooms:', validRooms);
      
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

      console.log('Joining room with user ID:', userId);

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
          console.log('User already in room, updating access time');
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
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
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
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
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
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
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
        console.log('Found orphaned associations in stats, cleaning up:', orphanedAssociations);
        
        const orphanedIds = orphanedAssociations.map(item => item.id);
        const { error: deleteError } = await supabase
          .from('user_rooms')
          .delete()
          .in('id', orphanedIds);
          
        if (deleteError) {
          console.error('Error cleaning up orphaned associations in stats:', deleteError);
        } else {
          console.log('Successfully cleaned up orphaned associations in stats');
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
