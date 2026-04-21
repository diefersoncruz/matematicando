import { supabase, handleSupabaseError } from './supabase.js';

export const userRoomService = {
  // Get all rooms for the current user
  async getUserRooms() {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // First get user's room associations
      const { data: userRoomData, error: userRoomError } = await supabase
        .from('user_rooms')
        .select('*')
        .eq('user_id', currentUser.id)
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
        .select('id, nome, tipo, descricao, data_expiracao, capacidade')
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
  async joinRoom(salaId, role = 'member') {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_rooms')
        .upsert({
          user_id: currentUser.id,
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
            .eq('user_id', currentUser.id)
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
