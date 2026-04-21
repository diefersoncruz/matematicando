import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                   import.meta.env.matematicando_SUPABASE_URL;

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                       import.meta.env.matematicando_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to handle Supabase errors
export const handleSupabaseError = (error) => {
  console.error('Supabase error:', error);
  if (error.code === 'PGRST116') {
    return 'Registro não encontrado';
  } else if (error.code === '23505') {
    return 'Registro já existe';
  } else if (error.code === '42501') {
    return 'Sem permissão para realizar esta operação';
  } else if (error.code === 'PGRST301') {
    return 'Erro de conexão com o banco de dados';
  }
  return error.message || 'Ocorreu um erro inesperado';
};
