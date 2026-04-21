import { supabase, handleSupabaseError } from './supabase.js';

export const roomPermissionService = {
  // Check if user can configure the room (is the creator)
  async canConfigureRoom(salaId, userId) {
    try {
      if (!salaId || !userId) {
        return false;
      }

      // Get the room to check who created it
      const { data: sala, error: salaError } = await supabase
        .from('salas')
        .select('created_by')
        .eq('id', salaId)
        .single();

      if (salaError) {
        console.error('Error checking room creator:', salaError);
        return false;
      }

      // User can configure if they are the creator
      return sala.created_by === userId;
    } catch (error) {
      console.error('Error checking room permission:', error);
      return false;
    }
  },

  // Check if user is room creator using database function
  async isRoomCreator(salaId, userId) {
    try {
      if (!salaId || !userId) {
        return false;
      }

      const { data, error } = await supabase
        .rpc('is_room_creator', {
          p_sala_id: salaId,
          p_user_id: userId
        });

      if (error) {
        console.error('Error checking room creator via RPC:', error);
        // Fallback to manual check
        return this.canConfigureRoom(salaId, userId);
      }

      return data || false;
    } catch (error) {
      console.error('Error in isRoomCreator:', error);
      return false;
    }
  },

  // Get rooms created by the user
  async getRoomsCreatedByUser(userId) {
    try {
      if (!userId) {
        return [];
      }

      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting rooms created by user:', error);
        throw new Error(handleSupabaseError(error));
      }

      return data || [];
    } catch (error) {
      console.error('Error in getRoomsCreatedByUser:', error);
      throw error;
    }
  },

  // Update room creator (for admin purposes)
  async updateRoomCreator(salaId, newCreatorId) {
    try {
      const { data, error } = await supabase
        .from('salas')
        .update({ created_by: newCreatorId })
        .eq('id', salaId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating room creator:', error);
      throw new Error(handleSupabaseError(error));
    }
  }
};
