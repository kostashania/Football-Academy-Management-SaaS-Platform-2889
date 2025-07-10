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
          // Get tenant info
          const { data: tenantData, error: tenantError } = await supabase
            .from('plrs_saas.tenant_users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (tenantError) {
            console.error('Error fetching tenant:', tenantError);
          } else {
            setUserTenant(tenantData);
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
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          // Get tenant info
          const { data: tenantData, error: tenantError } = await supabase
            .from('plrs_saas.tenant_users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (tenantError) {
            console.error('Error fetching tenant:', tenantError);
          } else {
            setUserTenant(tenantData);
          }
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
    try {
      const { error: schemaError } = await supabase.rpc('create_tenant_schema', {
        schema_name: schemaName
      });

      if (schemaError) {
        console.error('Error creating schema:', schemaError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createTenantSchema:', error);
      return false;
    }
  };

  const signIn = async (email, password) => {
    try {
      // Confirm user's email if it's not confirmed yet
      const { data: userData, error: userError } = await supabase.auth.admin
        .getUserByEmail(email);

      if (!userError && userData && !userData.email_confirmed_at) {
        // Attempt to automatically confirm the email
        try {
          await supabase.rpc('confirm_user_email', {
            user_email: email
          });
          console.log('Email confirmed automatically');
        } catch (confirmError) {
          console.warn('Could not auto-confirm email:', confirmError);
          // Continue with sign-in attempt anyway
        }
      }

      // Sign in the user
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) {
        if (error.message === 'Email not confirmed') {
          // If the error is about unconfirmed email, try to confirm it
          try {
            await supabase.rpc('confirm_user_email', {
              user_email: email
            });
            console.log('Email confirmed after sign-in attempt');
            
            // Try signing in again now that the email is confirmed
            const { data: { user: confirmedUser }, error: confirmedError } = 
              await supabase.auth.signInWithPassword({
                email,
                password,
                options: {
                  emailRedirectTo: window.location.origin
                }
              });
              
            if (confirmedError) {
              toast.error(confirmedError.message);
              throw confirmedError;
            }
            
            // Get tenant info for the confirmed user
            const { data: tenantData, error: tenantError } = await supabase
              .from('plrs_saas.tenant_users')
              .select('*')
              .eq('user_id', confirmedUser.id)
              .single();

            if (tenantError) {
              console.error('Error fetching tenant:', tenantError);
              throw tenantError;
            }

            // Create schema if it doesn't exist
            if (tenantData.schema_name !== 'shared') {
              await createTenantSchema(tenantData.schema_name);
            }

            setUser(confirmedUser);
            setUserTenant(tenantData);
            return { user: confirmedUser, tenantData };
          } catch (confirmError) {
            console.error('Failed to confirm email:', confirmError);
            toast.error('Please check your email and confirm your account first');
            throw error;
          }
        } else {
          toast.error(error.message);
          throw error;
        }
      }

      // Get tenant info
      const { data: tenantData, error: tenantError } = await supabase
        .from('plrs_saas.tenant_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (tenantError) {
        console.error('Error fetching tenant:', tenantError);
        throw tenantError;
      }

      // Create schema if it doesn't exist
      if (tenantData.schema_name !== 'shared') {
        await createTenantSchema(tenantData.schema_name);
      }

      setUser(user);
      setUserTenant(tenantData);
      return { user, tenantData };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email, password, role = ROLES.USER, schema_name = 'shared') => {
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

      // Create tenant user mapping
      const { error: mappingError } = await supabase
        .from('plrs_saas.tenant_users')
        .insert([
          { user_id: user.id, schema_name, role }
        ]);

      if (mappingError) throw mappingError;

      // Automatically confirm email for development
      try {
        await supabase.rpc('confirm_user_email', {
          user_email: email
        });
        console.log('Email confirmed automatically during signup');
      } catch (confirmError) {
        console.warn('Could not auto-confirm email:', confirmError);
        toast.info('Please check your email for confirmation link');
      }

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
        .from('plrs_saas.tenant_users')
        .select('*');
        
      return { data, error };
    } catch (error) {
      console.error('Get users error:', error);
      return { data: null, error };
    }
  };

  const createUser = async ({ email, password, role, schema_name }) => {
    return signUp(email, password, role, schema_name);
  };

  const updateUser = async (userId, { role, schema_name }) => {
    try {
      const { data, error } = await supabase
        .from('plrs_saas.tenant_users')
        .update({ role, schema_name, updated_at: new Date() })
        .eq('user_id', userId);
        
      return { data, error };
    } catch (error) {
      console.error('Update user error:', error);
      return { data: null, error };
    }
  };

  const deleteUser = async (userId) => {
    try {
      // Delete from auth.users (this will cascade delete from tenant_users)
      const { error } = await supabase.rpc('delete_user', {
        user_id: userId
      });
      
      return { error };
    } catch (error) {
      console.error('Delete user error:', error);
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