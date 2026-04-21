import { supabase, handleSupabaseError } from './supabase.js';

// Cache busting - force reload
console.log('authService.js loaded - version 2025-04-21-01-45');

export const authService = {
  // Register a new user
  async register(username, password) {
    try {
      // First, create a Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${username}@matematicando.local`, // Use username as email for simplicity
        password: password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) throw authError;

      // Then create the user record in our custom table
      const { data, error } = await supabase.rpc('create_user', {
        p_username: username,
        p_password: password
      });

      if (error) throw error;

      return {
        user: authData.user,
        profile: data
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Login user
  async login(username, password) {
    try {
      // Use email format for Supabase auth
      const email = `${username}@matematicando.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      // Store user info in localStorage with consistent ID based on username
      if (data.user) {
        // Generate consistent ID based on username (not Supabase UUID)
        const consistentId = `user-${username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        
        console.log('=== authService Login Debug ===');
        console.log('Username:', username);
        console.log('Supabase user ID:', data.user.id);
        console.log('Generated consistent ID:', consistentId);
        
        localStorage.setItem('currentUser', JSON.stringify({
          id: consistentId,
          username: username,
          email: data.user.email,
          supabaseId: data.user.id // Keep Supabase ID for reference if needed
        }));
        
        console.log('Stored in localStorage:', {
          id: consistentId,
          username: username,
          email: data.user.email
        });
        console.log('=== End authService Login Debug ===');
      }

      return data;
    } catch (error) {
      console.error('Error logging in user:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Logout user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Clear localStorage
      localStorage.removeItem('currentUser');
      
      return true;
    } catch (error) {
      console.error('Error logging out user:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Get current user
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    const user = this.getCurrentUser();
    return user !== null;
  },

  // Get current username
  getCurrentUsername() {
    const user = this.getCurrentUser();
    return user ? user.username : 'Jogador Anônimo';
  },

  // Update user profile
  async updateProfile(username) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Update Supabase auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          username: username
        }
      });

      if (authError) throw authError;

      // Update localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        ...currentUser,
        username: username
      }));

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(handleSupabaseError(error));
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Simple authentication (for demo purposes)
  async simpleAuth(username, password) {
    try {
      
      // Simple hash function for demo (in production use proper hashing)
      const hashPassword = (pwd) => btoa(pwd + 'salt');
      
      // First, check if user exists in our database
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, username, password_hash, created_at')
        .eq('username', username)
        .single();

      let user;
      
      if (existingUser) {
        // User exists, validate password
        const hashedPassword = hashPassword(password);
        
        if (existingUser.password_hash !== hashedPassword) {
          throw new Error('Senha incorreta');
        }
        
        user = {
          id: existingUser.id,
          username: existingUser.username,
          email: `${username}@matematicando.local`
        };
      } else {
        throw new Error('Usuário não encontrado');
      }

      localStorage.setItem('currentUser', JSON.stringify(user));
      
      return { user };
    } catch (error) {
      console.error('Erro na autenticação simples:', error);
      throw error;
    }
  },

  // Simple logout
  simpleLogout() {
    localStorage.removeItem('currentUser');
    return true;
  }
};
