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
          console.error("Session error:", sessionError);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log("Found existing session for user:", session.user.email);
          setUser(session.user);
          await fetchUserTenant(session.user);
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
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await fetchUserTenant(session.user);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log("User signed out");
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

  const fetchUserTenant = async (currentUser) => {
    try {
      console.log("Fetching tenant data for user:", currentUser.id);
      
      // First, try to find existing tenant data
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenant_users')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
        
      if (tenantError) {
        console.error("Error fetching tenant data:", tenantError);
        
        if (tenantError.code === 'PGRST116') {
          // No rows found, create new user
          console.log("No tenant data found, creating new entry");
          await createTenantUser(currentUser);
        } else {
          // Other error, create fallback
          await createTenantUser(currentUser);
        }
      } else if (tenantData) {
        console.log("Found tenant data:", tenantData);
        setUserTenant(tenantData);
      } else {
        console.log("No tenant data found, creating new entry");
        await createTenantUser(currentUser);
      }
    } catch (error) {
      console.error("Error in fetchUserTenant:", error);
      await createTenantUser(currentUser);
    }
  };

  const createTenantUser = async (currentUser) => {
    try {
      console.log("Creating tenant user for:", currentUser.email);
      
      // Determine role based on email
      let role = 'user';
      if (currentUser.email === 'superadmin@sportiko.eu') {
        role = 'superadmin';
      } else if (currentUser.email === 'admin@sportiko.eu') {
        role = 'tenantadmin';
      } else if (currentUser.email === 'test1@sportiko.eu') {
        role = 'trainer';
      } else if (currentUser.email === 'test2@sportiko.eu') {
        role = 'user';
      }

      const newTenantUser = {
        user_id: currentUser.id,
        schema_name: 'club01_',
        role: role,
        email: currentUser.email
      };

      console.log("Attempting to create tenant user:", newTenantUser);

      const { data, error: insertError } = await supabase
        .from('tenant_users')
        .insert([newTenantUser])
        .select()
        .single();
        
      if (insertError) {
        console.error("Error creating tenant user:", insertError);
        // Fallback to mock data
        console.log("Using fallback tenant data");
        setUserTenant(newTenantUser);
      } else {
        console.log("Created new tenant user entry:", data);
        setUserTenant(data);
      }
    } catch (error) {
      console.error("Error in createTenantUser:", error);
      // Fallback to mock tenant
      const fallbackTenant = {
        user_id: currentUser.id,
        schema_name: 'club01_',
        role: 'tenantadmin',
        email: currentUser.email
      };
      console.log("Using fallback tenant data:", fallbackTenant);
      setUserTenant(fallbackTenant);
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log("Signing in with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Sign in error:", error);
        toast.error(error.message);
        throw error;
      }

      const user = data.user;
      console.log("User signed in successfully:", user.email);
      setUser(user);
      
      return { user };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email, password, role = ROLES.USER, schema_name = 'club01_') => {
    try {
      const { data, error } = await supabase.auth.signUp({
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

      const user = data.user;
      
      // Create tenant user entry
      const { error: insertError } = await supabase
        .from('tenant_users')
        .insert([{
          user_id: user.id,
          schema_name: schema_name,
          role: role,
          email: email
        }]);
        
      if (insertError) {
        console.error("Error creating tenant user:", insertError);
      }
      
      toast.success('User created successfully!');
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
    try {
      const { data, error } = await supabase
        .from('tenant_users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching users:", error);
        return { data: [], error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error("Error in getUsers:", error);
      return { data: [], error };
    }
  };

  const createUser = async ({ email, password, role, schema_name }) => {
    try {
      // Create the user via auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        console.error("Sign up error:", error);
        throw error;
      }

      const user = data.user;
      
      if (user) {
        // Create tenant user entry
        const { error: insertError } = await supabase
          .from('tenant_users')
          .insert([{
            user_id: user.id,
            schema_name: schema_name || 'club01_',
            role: role || 'user',
            email: email
          }]);
          
        if (insertError) {
          console.error("Error creating tenant user:", insertError);
          throw insertError;
        }
        
        toast.success('User created successfully!');
        return { user, error: null };
      } else {
        throw new Error('User creation failed');
      }
    } catch (error) {
      console.error("Error in createUser:", error);
      toast.error(error.message || "Failed to create user");
      return { user: null, error };
    }
  };

  const updateUser = async (userId, { role, schema_name }) => {
    try {
      const { data, error } = await supabase
        .from('tenant_users')
        .update({ 
          role, 
          schema_name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating user:', error);
      return { data: null, error };
    }
  };

  const deleteUser = async (userId) => {
    try {
      // Delete from tenant_users
      const { error: deleteError } = await supabase
        .from('tenant_users')
        .delete()
        .eq('user_id', userId);
        
      if (deleteError) {
        console.error("Error deleting tenant user:", deleteError);
        throw deleteError;
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { error };
    }
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