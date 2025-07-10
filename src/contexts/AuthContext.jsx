import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ROLES } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userTenant, setUserTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          setUser(session.user);
          // For demo purposes, we'll create a mock tenant
          setUserTenant({
            user_id: session.user.id,
            schema_name: 'club01_',
            role: 'tenantadmin'
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // For demo purposes, we'll create a mock tenant
          setUserTenant({
            user_id: session.user.id,
            schema_name: 'club01_',
            role: 'tenantadmin'
          });
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserTenant(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const createTenantSchema = async (schemaName) => {
    console.log('Creating tenant schema:', schemaName);
    return true; // Mock implementation
  };

  const signIn = async (email, password) => {
    try {
      // Sign in the user
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      // For demo purposes, we'll create a mock tenant
      const tenantData = {
        user_id: user.id,
        schema_name: 'club01_',
        role: 'tenantadmin'
      };

      setUser(user);
      setUserTenant(tenantData);
      return { user, tenantData };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email, password, role = ROLES.USER, schema_name = 'club01_') => {
    try {
      const { data: { user }, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            role,
            schema_name
          }
        }
      });

      if (error) throw error;

      // For demo purposes, we'll create a mock tenant
      const tenantData = {
        user_id: user.id,
        schema_name: schema_name,
        role: role
      };

      setUser(user);
      setUserTenant(tenantData);
      toast.success('Sign up successful! Check your email for confirmation.');

      return { user };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }
      
      setUser(null);
      setUserTenant(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const getUsers = async () => {
    // Mock implementation for demo
    const mockUsers = [
      {
        id: '1',
        user_id: 'mock-id-1',
        schema_name: 'club01_',
        role: 'tenantadmin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        user_id: 'mock-id-2',
        schema_name: 'club01_',
        role: 'trainer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    return { data: mockUsers, error: null };
  };

  const createUser = async ({ email, password, role, schema_name }) => {
    return signUp(email, password, role, schema_name);
  };

  const updateUser = async (userId, { role, schema_name }) => {
    // Mock implementation
    console.log('Updating user:', userId, role, schema_name);
    return { data: null, error: null };
  };

  const deleteUser = async (userId) => {
    // Mock implementation
    console.log('Deleting user:', userId);
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user,
      userTenant,
      loading,
      signIn,
      signUp,
      signOut,
      getUsers,
      createUser,
      updateUser,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };