import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

  // Helper function to get current user's tenant info
  const getCurrentUserTenant = async (userId) => {
    if (!userId) return null;
    console.log("Getting tenant info for user:", userId);
    try {
      // Query the correct schema and table
      const { data, error } = await supabase
        .from('plrs_saas.tenant_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log("Tenant data response:", { data, error });

      if (error) {
        console.error("Error getting tenant data:", error);
        // For demo purposes, create a mock tenant if not found
        if (error.code === '42P01' || !data) {
          return {
            id: 'mock-id',
            user_id: userId,
            schema_name: 'club01_',
            role: 'tenantadmin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
        return null;
      }
      return data;
    } catch (err) {
      console.error("Exception getting tenant data:", err);
      // For demo purposes, create a mock tenant
      return {
        id: 'mock-id',
        user_id: userId,
        schema_name: 'club01_',
        role: 'tenantadmin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session:", session?.user?.email);
        setUser(session?.user ?? null);

        if (session?.user) {
          const tenantData = await getCurrentUserTenant(session.user.id);
          console.log("Initial tenant data:", tenantData);
          setUserTenant(tenantData);
        }
      } catch (error) {
        console.error("Error getting initial session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setUser(session?.user ?? null);

        if (session?.user) {
          const tenantData = await getCurrentUserTenant(session.user.id);
          console.log("Auth change tenant data:", tenantData);
          setUserTenant(tenantData);
        } else {
          setUserTenant(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      console.log("Attempting to sign in:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Sign in error:", error);
        // For demo purposes, trying to sign up if sign in fails
        if (error.message.includes('Invalid login credentials')) {
          console.log("Attempting to sign up instead");
          return await signUp(email, password);
        }
      } else {
        console.log("Sign in successful:", data);
        // Immediately try to get tenant info after successful login
        if (data.user) {
          const tenantData = await getCurrentUserTenant(data.user.id);
          setUserTenant(tenantData);
        }
      }
      return { data, error };
    } catch (error) {
      console.error("Unexpected error during sign in:", error);
      return { data: null, error };
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      console.log("Attempting to sign up:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        console.error("Sign up error:", error);
      } else {
        console.log("Sign up successful:", data);
        // For demo purposes, create a tenant user entry for new sign-ups
        if (data.user) {
          try {
            // Add mock tenant user data
            const mockTenant = {
              user_id: data.user.id,
              schema_name: 'club01_',
              role: 'tenantadmin'
            };
            
            // Try to insert the tenant user record
            const { error: insertError } = await supabase
              .from('plrs_saas.tenant_users')
              .insert(mockTenant);
              
            if (!insertError) {
              setUserTenant(mockTenant);
            } else {
              console.error("Error creating tenant user:", insertError);
            }
          } catch (err) {
            console.error("Error creating tenant user:", err);
          }
        }
      }
      return { data, error };
    } catch (error) {
      console.error("Sign up error:", error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log("Attempting to sign out");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      } else {
        console.log("Sign out successful");
        // Clear state on successful logout
        setUser(null);
        setUserTenant(null);
      }
      return { error };
    } catch (error) {
      console.error("Unexpected error during sign out:", error);
      return { error };
    }
  };

  // Function to manage users (for superadmin)
  const createUser = async (userData) => {
    try {
      // Mock successful user creation for demo
      const mockUser = {
        id: `user-${Math.random().toString(36).substring(2, 9)}`,
        email: userData.email,
        role: userData.role,
        schema_name: userData.schema_name,
        created_at: new Date().toISOString()
      };
      return { data: mockUser, error: null };
    } catch (error) {
      console.error("Error creating user:", error);
      return { data: null, error };
    }
  };

  const getUsers = async () => {
    try {
      // Try to get actual users from database
      const { data, error } = await supabase
        .from('plrs_saas.tenant_users')
        .select('*');
        
      if (error || !data || data.length === 0) {
        // Mock users for demo if no data available
        const mockUsers = [
          {
            id: 'user-1',
            user_id: 'auth-user-1',
            schema_name: 'club01_',
            role: 'tenantadmin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'user-2',
            user_id: 'auth-user-2',
            schema_name: 'club01_',
            role: 'trainer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'user-3',
            user_id: 'auth-user-3',
            schema_name: 'club01_',
            role: 'player',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        return { data: mockUsers, error: null };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error("Error getting users:", error);
      return { data: null, error };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      // Mock successful update
      return {
        data: {
          id: 'user-1',
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        },
        error: null
      };
    } catch (error) {
      console.error("Error updating user:", error);
      return { data: null, error };
    }
  };

  const deleteUser = async (userId) => {
    try {
      // Mock successful delete
      return { error: null };
    } catch (error) {
      console.error("Error deleting user:", error);
      return { error };
    }
  };

  const value = {
    user,
    userTenant,
    loading,
    signIn,
    signUp,
    signOut,
    createUser,
    getUsers,
    updateUser,
    deleteUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};