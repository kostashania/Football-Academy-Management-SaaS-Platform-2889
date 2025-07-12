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
          
          // Check for actual tenant info from the database
          try {
            const { data: tenantData, error: tenantError } = await supabase
              .from('tenant_users')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
              
            if (tenantError) {
              console.error("Error fetching tenant data:", tenantError);
              // Fallback to mock tenant
              setUserTenant({
                user_id: session.user.id,
                schema_name: 'club01_',
                role: 'tenantadmin'
              });
            } else if (tenantData) {
              console.log("Found tenant data:", tenantData);
              setUserTenant(tenantData);
            } else {
              console.log("No tenant data found, using mock data");
              // Fallback to mock tenant
              setUserTenant({
                user_id: session.user.id,
                schema_name: 'club01_',
                role: 'tenantadmin'
              });
            }
          } catch (error) {
            console.error("Error in tenant fetch:", error);
            // Fallback to mock tenant
            setUserTenant({
              user_id: session.user.id,
              schema_name: 'club01_',
              role: 'tenantadmin'
            });
          }
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
          
          // Try to fetch actual tenant data
          try {
            const { data: tenantData, error: tenantError } = await supabase
              .from('tenant_users')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
              
            if (tenantError) {
              console.error("Error fetching tenant data:", tenantError);
              // Fallback to mock tenant
              setUserTenant({
                user_id: session.user.id,
                schema_name: 'club01_',
                role: 'tenantadmin'
              });
            } else if (tenantData) {
              console.log("Found tenant data:", tenantData);
              setUserTenant(tenantData);
            } else {
              console.log("No tenant data found, using mock data");
              // Fallback to mock tenant
              setUserTenant({
                user_id: session.user.id,
                schema_name: 'club01_',
                role: 'tenantadmin'
              });
            }
          } catch (error) {
            console.error("Error in tenant fetch:", error);
            // Fallback to mock tenant
            setUserTenant({
              user_id: session.user.id,
              schema_name: 'club01_',
              role: 'tenantadmin'
            });
          }
          
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

  const signIn = async (email, password) => {
    try {
      console.log("Signing in with email:", email);
      // Sign in the user
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

      // Try to fetch actual tenant data
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenant_users')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (tenantError) {
          console.error("Error fetching tenant data:", tenantError);
          // Fallback to mock tenant
          setUserTenant({
            user_id: user.id,
            schema_name: 'club01_',
            role: 'tenantadmin'
          });
        } else if (tenantData) {
          console.log("Found tenant data:", tenantData);
          setUserTenant(tenantData);
        } else {
          console.log("No tenant data found, creating new tenant user entry");
          
          // Create a new tenant user entry
          const { error: insertError } = await supabase
            .from('tenant_users')
            .insert([{
              user_id: user.id,
              schema_name: 'club01_',
              role: 'tenantadmin'
            }]);
            
          if (insertError) {
            console.error("Error creating tenant user:", insertError);
          } else {
            console.log("Created new tenant user entry");
          }
          
          // Set tenant data
          setUserTenant({
            user_id: user.id,
            schema_name: 'club01_',
            role: 'tenantadmin'
          });
        }
      } catch (error) {
        console.error("Error in tenant fetch:", error);
        // Fallback to mock tenant
        setUserTenant({
          user_id: user.id,
          schema_name: 'club01_',
          role: 'tenantadmin'
        });
      }

      setUser(user);
      console.log("Set user and tenant data after login");
      
      return { user, tenantData: userTenant };
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
          role: role
        }]);
        
      if (insertError) {
        console.error("Error creating tenant user:", insertError);
        throw insertError;
      }
      
      // Set tenant data
      const tenantData = {
        user_id: user.id,
        schema_name: schema_name,
        role: role
      };

      setUser(user);
      setUserTenant(tenantData);
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
        .select('*');
        
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
      // Create the user in auth
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role,
          schema_name
        }
      });

      if (error) {
        // If admin API fails, fall back to regular signup
        console.warn("Admin API failed, attempting regular signup:", error);
        return signUp(email, password, role, schema_name);
      }

      const user = data.user;
      
      // Create tenant user entry
      const { error: insertError } = await supabase
        .from('tenant_users')
        .insert([{
          user_id: user.id,
          schema_name: schema_name,
          role: role
        }]);
        
      if (insertError) {
        console.error("Error creating tenant user:", insertError);
        throw insertError;
      }
      
      toast.success('User created successfully!');
      return { user, error: null };
    } catch (error) {
      console.error("Error in createUser:", error);
      // Final fallback to signup
      return signUp(email, password, role, schema_name);
    }
  };

  const updateUser = async (userId, { role, schema_name }) => {
    try {
      const { error } = await supabase
        .from('tenant_users')
        .update({ role, schema_name })
        .eq('user_id', userId);
        
      if (error) throw error;
      
      return { data: { role, schema_name }, error: null };
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
      
      // Try to delete the user from auth
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.error("Error deleting auth user:", authError);
          // Continue anyway as we've removed the tenant_user entry
        }
      } catch (error) {
        console.error("Error in auth deletion:", error);
        // Continue anyway as we've removed the tenant_user entry
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