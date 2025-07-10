import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUserTenant, SHARED_SCHEMA } from '../config/supabase';

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

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          const tenantData = await getCurrentUserTenant();
          setUserTenant(tenantData);
        } catch (error) {
          console.error("Error getting tenant data:", error);
        }
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            const tenantData = await getCurrentUserTenant();
            console.log("Got tenant data:", tenantData);
            setUserTenant(tenantData);
          } catch (error) {
            console.error("Error getting tenant data on auth change:", error);
          }
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
    const { error } = await supabase.auth.signOut();
    return { error };
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