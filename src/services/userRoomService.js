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

      if (roomsError) throw roomsError;

      // Combine the data
      return userRoomData.map(userRoom => {
        const room = roomsData.find(r => r.id === userRoom.sala_id);
        return {
          ...userRoom,
          salas: room || null
        };
      }).filter(item => item.salas !== null);
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

      const { data, error } = await supabase
        .from('user_rooms')
        .select('role, joined_at, last_accessed')
        .eq('user_id', currentUser.id)
        .eq('is_active', true);

      if (error) throw error;

      const stats = {
        totalRooms: data.length,
        adminRooms: data.filter(r => r.role === 'admin').length,
        memberRooms: data.filter(r => r.role === 'member').length,
        studentRooms: data.filter(r => r.role === 'student').length,
        lastJoined: data.length > 0 ? new Date(Math.max(...data.map(r => new Date(r.joined_at)))) : null,
        lastAccessed: data.length > 0 ? new Date(Math.max(...data.map(r => new Date(r.last_accessed)))) : null
      };

      return stats;
    } catch (error) {
      console.error('Error getting user room stats:', error);
      throw new Error(handleSupabaseError(error));
    }
  }
};
