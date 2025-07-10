import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, SHARED_SCHEMA } from '../config/supabase';

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
      const { data, error } = await supabase
        .from(`${SHARED_SCHEMA}.tenant_users`)
        .select('*')
        .eq('user_id', userId)
        .single();
      
      console.log("Tenant data response:", { data, error });
      
      if (error) {
        console.error("Error getting tenant data:", error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error("Exception getting tenant data:", err);
      return null;
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
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
      // First create the user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      // Then add to tenant_users table
      const { data, error } = await supabase
        .from(`${SHARED_SCHEMA}.tenant_users`)
        .insert({
          user_id: authData.user.id,
          schema_name: userData.schema_name,
          role: userData.role
        })
        .select();
      
      return { data, error };
    } catch (error) {
      console.error("Error creating user:", error);
      return { data: null, error };
    }
  };

  const getUsers = async () => {
    try {
      const { data, error } = await supabase
        .from(`${SHARED_SCHEMA}.tenant_users`)
        .select('*');
      
      return { data, error };
    } catch (error) {
      console.error("Error getting users:", error);
      return { data: null, error };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from(`${SHARED_SCHEMA}.tenant_users`)
        .update(updates)
        .eq('user_id', userId)
        .select();
      
      return { data, error };
    } catch (error) {
      console.error("Error updating user:", error);
      return { data: null, error };
    }
  };

  const deleteUser = async (userId) => {
    try {
      // Delete from tenant_users first
      const { error: deleteError } = await supabase
        .from(`${SHARED_SCHEMA}.tenant_users`)
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Then delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      return { error: authError };
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