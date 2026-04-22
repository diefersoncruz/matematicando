import { supabase, handleSupabaseError } from './supabase.js';
import { secureStorage } from '../utils/secureStorage.js';


export const authService = {
  // Check if email already exists
  async checkEmailExists(email) {
    try {
      const { data, error } = await supabase.rpc('check_email_exists', {
        p_email: email
      });

      if (error) throw error;
      return data; // Returns true if email exists, false otherwise
    } catch (error) {
      return false;
    }
  },

  // Register a new user
  async registerUser(name, email, password) {
    try {
      // Check if email already exists in our custom table
      const emailExists = await this.checkEmailExists(email);
      if (emailExists) {
        throw new Error('Este email já está cadastrado. Por favor, use outro email.');
      }

      // First, create a Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name
          }
        }
      });

      // Note: Supabase requires email confirmation by default
      // We'll handle this by either:
      // 1. Configuring Supabase to disable email confirmation (in dashboard)
      // 2. Or handling the user as logged in after registration

      if (authError) {
        // Handle Supabase auth errors for duplicate email
        if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
          throw new Error('Este email já está cadastrado. Por favor, use outro email.');
        }
        throw authError;
      }

      // Then create the user record in our custom table
      const { data, error } = await supabase.rpc('create_user_with_details', {
        p_name: name,
        p_email: email,
        p_username: email.split('@')[0], // Use email prefix as username for compatibility
        p_password: password
      });
      

      if (error) {
        // Handle database constraint error for duplicate email
        if (error.message.includes('Email já está em uso')) {
          throw new Error('Este email já está cadastrado. Por favor, use outro email.');
        }
        throw error;
      }

      // Store user info in secure storage after successful registration
      // Note: User may need email confirmation depending on Supabase settings
      if (authData.user) {
        const currentUser = {
          id: authData.user.id,
          username: email.split('@')[0], // Use email prefix as username
          email: email,
          name: name, // Ensure name is stored correctly
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(), // Set last_login to registration time
          email_confirmed: !authError // Track if email confirmation is needed
        };
        
        secureStorage.setItem('currentUser', currentUser);
      }

      return {
        user: authData.user,
        profile: data,
        needsEmailConfirmation: !!(authData.user && authError?.message?.includes('Email not confirmed'))
      };
    } catch (error) {
            throw new Error(error.message || 'Ocorreu um erro ao cadastrar usuário. Tente novamente.');
    }
  },

  // Login user
  async loginUser(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;

      // Store user info in secure storage
      if (data.user) {
        // Update last_login in database
        try {
          await supabase.rpc('update_last_login', {
            p_email: email
          });
        } catch (error) {
          // Continue with login even if last_login update fails
        }

        const currentUser = {
          id: data.user.id,
          username: email.split('@')[0], // Use email prefix as username
          email: email,
          name: data.user.user_metadata?.name || '',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString()
        };
        
        secureStorage.setItem('currentUser', currentUser);
      }

      return data;
    } catch (error) {
            throw new Error(handleSupabaseError(error));
    }
  },

  // Logout user
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Clear all auth-related data
      secureStorage.removeItem('currentUser');
      secureStorage.removeItem('currentRoom');
      
      // Clear any other auth-related data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('auth_') || key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      });
      
      
      return true;
    } catch (error) {
            throw new Error(handleSupabaseError(error));
    }
  },

  // Get current user
  getCurrentUser() {
    try {
      return secureStorage.getItem('currentUser');
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

  // Get current name
  getCurrentName() {
    const user = this.getCurrentUser();
    return user ? user.name : '';
  },

  // Get current email
  getCurrentEmail() {
    const user = this.getCurrentUser();
    return user ? user.email : '';
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

      // Update secure storage
      secureStorage.setItem('currentUser', {
        ...currentUser,
        username: username
      });

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

};
