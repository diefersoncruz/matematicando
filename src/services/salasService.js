import { supabase, handleSupabaseError } from './supabase.js';

export const salasService = {
  // Fetch all salas
  async getAllSalas() {
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('salasService: Supabase error:', error);
        throw error;
      }
      
      console.log('salasService: Successfully fetched salas:', data?.length || 0, 'items');
      return data || [];
    } catch (error) {
      console.error('salasService: Error fetching salas:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Fetch sala by ID
  async getSalaById(id) {
    try {
      const { data, error } = await supabase
        .from('salas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching sala:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Create new sala
  async createSala(salaData) {
    try {
      console.log('=== salasService.createSala Debug ===');
      
      // Get current user ID to set as creator
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      console.log('Current user from localStorage:', currentUser);
      
      const createdBy = currentUser?.id || null;
      console.log('Created by ID:', createdBy);
      console.log('Created by type:', typeof createdBy);

      const salaDataToInsert = {
        nome: salaData.nome,
        descricao: salaData.descricao || null,
        data_expiracao: salaData.dataExpiracao || null,
        capacidade: salaData.capacidade ? parseInt(salaData.capacidade) : null,
        tipo: salaData.tipo || 'aula',
        created_by: createdBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Sala data to insert:', salaDataToInsert);

      const { data, error } = await supabase
        .from('salas')
        .insert([salaDataToInsert])
        .select()
        .single();

      if (error) throw error;
      
      console.log('Sala created successfully:', data);
      console.log('Sala created_by field:', data.created_by);
      console.log('=== End salasService.createSala Debug ===');
      
      return data;
    } catch (error) {
      console.error('Error creating sala:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Update sala
  async updateSala(id, salaData) {
    try {
      const { data, error } = await supabase
        .from('salas')
        .update({
          nome: salaData.nome,
          descricao: salaData.descricao || null,
          data_expiracao: salaData.dataExpiracao || null,
          capacidade: salaData.capacidade ? parseInt(salaData.capacidade) : null,
          tipo: salaData.tipo || 'aula',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating sala:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Delete sala
  async deleteSala(id) {
    try {
      const { error } = await supabase
        .from('salas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting sala:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get salas by status (active, expired, etc.)
  async getSalasByStatus(status) {
    try {
      let query = supabase.from('salas').select('*');

      if (status === 'active') {
        query = query.or('data_expiracao.is.null,data_expiracao.gte.' + new Date().toISOString().split('T')[0]);
      } else if (status === 'expired') {
        query = query.lt('data_expiracao', new Date().toISOString().split('T')[0]);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching salas by status:', error);
      throw new Error(handleSupabaseError(error));
    }
  }
};
