import { supabase, handleSupabaseError } from './supabase.js';

// Cache busting - force reload
console.log('authService.js loaded - version 2025-04-21-01-45');

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
      console.error('Error checking email existence:', error);
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
      
      console.log('=== Database Debug ===');
      console.log('Creating user with params:', {
        p_name: name,
        p_email: email,
        p_username: email.split('@')[0]
      });

      if (error) {
        // Handle database constraint error for duplicate email
        if (error.message.includes('Email já está em uso')) {
          throw new Error('Este email já está cadastrado. Por favor, use outro email.');
        }
        throw error;
      }

      // Store user info in localStorage after successful registration
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
        
        console.log('=== authService Registration Debug ===');
        console.log('User data stored after registration:', currentUser);
        console.log('Name stored:', currentUser.name);
        console.log('Last login set:', currentUser.last_login);
        console.log('Email confirmation needed:', !currentUser.email_confirmed);
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }

      return {
        user: authData.user,
        profile: data,
        needsEmailConfirmation: !!(authData.user && authError?.message?.includes('Email not confirmed'))
      };
    } catch (error) {
      console.error('Error registering user:', error);
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

      // Store user info in localStorage
      if (data.user) {
        // Update last_login in database
        try {
          await supabase.rpc('update_last_login', {
            p_email: email
          });
          console.log('Last login updated for:', email);
        } catch (error) {
          console.error('Error updating last login:', error);
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
        
        console.log('=== authService Login Debug ===');
        console.log('Email used for login:', email);
        console.log('User data stored:', currentUser);
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
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

      // Clear all auth-related data
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentRoom');
      
      // Clear any other auth-related data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('auth_') || key.startsWith('supabase.auth.')) {
          localStorage.removeItem(key);
        }
      });
      
      console.log('=== authService Logout Debug ===');
      console.log('User logged out successfully');
      console.log('LocalStorage cleared');
      
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
    console.log('=== getCurrentUsername Debug ===');
    console.log('User data:', user);
    console.log('Username:', user ? user.username : 'Jogador Anônimo');
    return user ? user.username : 'Jogador Anônimo';
  },

  // Get current name
  getCurrentName() {
    const user = this.getCurrentUser();
    console.log('=== getCurrentName Debug ===');
    console.log('User data:', user);
    console.log('Name:', user ? user.name : '');
    return user ? user.name : '';
  },

  // Get current email
  getCurrentEmail() {
    const user = this.getCurrentUser();
    console.log('=== getCurrentEmail Debug ===');
    console.log('User data:', user);
    console.log('Email:', user ? user.email : '');
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

  
  
  // Simple authentication (for demo purposes) - mantido para compatibilidade
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
        // User doesn't exist, create new user
        const hashedPassword = hashPassword(password);
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([{
            username: username,
            password_hash: hashedPassword,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) {
          console.error('Erro ao criar usuário:', createError);
          throw createError;
        }

        console.log('Novo usuário criado:', newUser);
        user = {
          id: newUser.id,
          username: newUser.username,
          email: `${username}@matematicando.local`
        };
      }

      localStorage.setItem('currentUser', JSON.stringify(user));
      console.log('Usuário armazenado no localStorage:', user);
      console.log('=== Fim da autenticação do usuário ===');
      
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
