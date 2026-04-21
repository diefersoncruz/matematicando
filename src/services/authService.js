import { supabase, handleSupabaseError } from './supabase.js';

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

      // Store user info in localStorage
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify({
          id: data.user.id,
          username: username,
          email: data.user.email
        }));
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

  // Simple authentication check (for demo purposes)
  async simpleAuth(username, password) {
    try {
      // For now, just store in localStorage without Supabase auth
      // This is a simplified version for testing
      const user = {
        id: `user_${Date.now()}`,
        username: username,
        email: `${username}@matematicando.local`
      };

      localStorage.setItem('currentUser', JSON.stringify(user));
      
      return { user };
    } catch (error) {
      console.error('Error in simple auth:', error);
      throw error;
    }
  },

  // Simple logout
  simpleLogout() {
    localStorage.removeItem('currentUser');
    return true;
  }
};
