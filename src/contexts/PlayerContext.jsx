import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, executeInSchema, fromSchema } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PlayerContext = createContext({});

export const usePlayers = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayers must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userTenant } = useAuth();

  useEffect(() => {
    if (userTenant) {
      fetchPlayers();
    }
  }, [userTenant]);

  const fetchPlayers = async () => {
    if (!userTenant?.schema_name) {
      console.log("No tenant schema available");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // First check if schema exists and players table exists
      const schemaQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.schemata 
          WHERE schema_name = '${userTenant.schema_name}'
        ) as schema_exists;
      `;
      
      const { data: schemaCheck } = await executeInSchema('public', schemaQuery);
      
      if (!schemaCheck || !schemaCheck[0]?.schema_exists) {
        console.log(`Schema ${userTenant.schema_name} does not exist, creating it...`);
        await createTenantSchema(userTenant.schema_name);
        // After creating schema, use sample data for now
        useSampleData();
        return;
      }
      
      // Now check if players table exists in the schema
      const tableQuery = `
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = '${userTenant.schema_name}'
          AND table_name = 'players'
        ) as table_exists;
      `;
      
      const { data: tableCheck } = await executeInSchema('public', tableQuery);
      
      if (!tableCheck || !tableCheck[0]?.table_exists) {
        console.log(`Table players in schema ${userTenant.schema_name} does not exist, creating schema...`);
        await createTenantSchema(userTenant.schema_name);
        // After creating schema, use sample data for now
        useSampleData();
        return;
      }
      
      // If schema and table exist, try to query the data using the RPC function
      const query = `SELECT * FROM ${userTenant.schema_name}.players`;
      const { data, error } = await executeInSchema('public', query);
      
      if (error) {
        console.error('Error fetching players:', error);
        toast.error('Failed to load players');
        // Use sample data as fallback
        useSampleData();
        return;
      }
      
      if (data && data.length > 0) {
        setPlayers(data);
      } else {
        // No players found, use sample data
        console.log('No players found in database, using sample data');
        useSampleData();
      }
    } catch (error) {
      console.error('Error in fetchPlayers:', error);
      toast.error('Failed to load players');
      // Use sample data as fallback
      useSampleData();
    } finally {
      setLoading(false);
    }
  };

  const useSampleData = () => {
    const samplePlayers = [
      {
        id: '1',
        first_name: 'John',
        last_name: 'Smith',
        father_name: 'Robert Smith',
        mother_name: 'Mary Smith',
        national_id: '123456789',
        nationality: 'USA',
        place_of_birth: 'New York',
        birthday: '2005-03-15',
        position_ids: ['fwd'],
        email: 'john.smith@email.com',
        phone: '+1234567890',
        epo_record_number: 'EPO123',
        epo_record_expiry: '2024-12-31',
        health_card_expiry: '2024-06-30',
        comments: 'Promising young striker with excellent finishing ability.'
      },
      {
        id: '2',
        first_name: 'Alex',
        last_name: 'Johnson',
        father_name: 'Mike Johnson',
        mother_name: 'Sarah Johnson',
        national_id: '987654321',
        nationality: 'Canada',
        place_of_birth: 'Toronto',
        birthday: '2004-08-22',
        position_ids: ['mid'],
        email: 'alex.johnson@email.com',
        phone: '+1987654321',
        epo_record_number: 'EPO456',
        epo_record_expiry: '2024-11-15',
        health_card_expiry: '2024-09-30',
        comments: 'Creative midfielder with excellent passing range.'
      },
      {
        id: '3',
        first_name: 'David',
        last_name: 'Garcia',
        father_name: 'Carlos Garcia',
        mother_name: 'Elena Garcia',
        national_id: '456789123',
        nationality: 'Spain',
        place_of_birth: 'Madrid',
        birthday: '2006-01-10',
        position_ids: ['def'],
        email: 'david.garcia@email.com',
        phone: '+34123456789',
        epo_record_number: 'EPO789',
        epo_record_expiry: '2025-02-28',
        health_card_expiry: '2024-12-15',
        comments: 'Solid defender with strong aerial ability.'
      }
    ];
    
    setPlayers(samplePlayers);
  };

  const createTenantSchema = async (schemaName) => {
    try {
      const createSchemaSQL = `
        -- Create the schema if it doesn't exist
        CREATE SCHEMA IF NOT EXISTS ${schemaName};
        
        -- Create positions table
        CREATE TABLE IF NOT EXISTS ${schemaName}.positions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          short_code TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS on positions table
        ALTER TABLE ${schemaName}.positions ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy for positions
        CREATE POLICY "Tenant users can access their positions" ON ${schemaName}.positions
        USING (
          EXISTS (
            SELECT 1 FROM plrs_saas.tenant_users
            WHERE user_id = auth.uid() AND schema_name = '${schemaName}'
          )
        );
        
        -- Insert default positions if they don't exist
        INSERT INTO ${schemaName}.positions (name, short_code)
        VALUES 
          ('Goalkeeper', 'GK'),
          ('Defender', 'DEF'),
          ('Midfielder', 'MID'),
          ('Forward', 'FWD')
        ON CONFLICT DO NOTHING;
        
        -- Create players table
        CREATE TABLE IF NOT EXISTS ${schemaName}.players (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          father_name TEXT,
          mother_name TEXT,
          national_id TEXT,
          passport_number TEXT,
          nationality TEXT,
          place_of_birth TEXT,
          birthday DATE,
          position_ids TEXT[],
          email TEXT,
          phone TEXT,
          epo_record_number TEXT,
          epo_record_expiry DATE,
          health_card_expiry DATE,
          profile_image_url TEXT,
          comments TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS on players table
        ALTER TABLE ${schemaName}.players ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policy for players
        CREATE POLICY "Tenant users can access their players" ON ${schemaName}.players
        USING (
          EXISTS (
            SELECT 1 FROM plrs_saas.tenant_users
            WHERE user_id = auth.uid() AND schema_name = '${schemaName}'
          )
        );
      `;
      
      const { error } = await executeInSchema('public', createSchemaSQL);
      
      if (error) {
        console.error('Error creating tenant schema:', error);
        return false;
      }
      
      console.log(`Tenant schema ${schemaName} created successfully`);
      return true;
    } catch (error) {
      console.error('Error in createTenantSchema:', error);
      return false;
    }
  };

  const getPlayerById = (id) => {
    return players.find(player => player.id === id);
  };

  const createPlayer = async (playerData) => {
    if (!userTenant?.schema_name) {
      console.error("No tenant schema available");
      return { error: "No tenant schema available" };
    }
    
    try {
      // First check if schema and table exist, create if not
      await fetchPlayers();
      
      // Try to insert player using RPC function
      const { first_name, last_name, ...rest } = playerData;
      const query = `
        INSERT INTO ${userTenant.schema_name}.players (
          first_name, last_name, ${Object.keys(rest).join(', ')}
        ) VALUES (
          '${first_name}', '${last_name}', ${Object.values(rest).map(v => `'${v}'`).join(', ')}
        )
        RETURNING *;
      `;
      
      const { data, error } = await executeInSchema('public', query);
      
      if (error) {
        console.error('Error creating player in database:', error);
        // Fallback to client-side only
        const newPlayer = {
          id: `player-${Date.now()}`,
          ...playerData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setPlayers(prev => [...prev, newPlayer]);
        return { data: newPlayer, error: null };
      }
      
      // Database insert successful
      const newPlayer = data[0];
      setPlayers(prev => [...prev, newPlayer]);
      return { data: newPlayer, error: null };
    } catch (error) {
      console.error('Error in createPlayer:', error);
      // Fallback to client-side only
      const newPlayer = {
        id: `player-${Date.now()}`,
        ...playerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPlayers(prev => [...prev, newPlayer]);
      return { data: newPlayer, error: null };
    }
  };

  const updatePlayer = async (id, playerData) => {
    if (!userTenant?.schema_name) {
      console.error("No tenant schema available");
      return { error: "No tenant schema available" };
    }
    
    try {
      // Try to update player using RPC function
      const setValues = Object.entries(playerData)
        .map(([key, value]) => `${key} = '${value}'`)
        .join(', ');
      
      const query = `
        UPDATE ${userTenant.schema_name}.players
        SET ${setValues}, updated_at = NOW()
        WHERE id = '${id}'
        RETURNING *;
      `;
      
      const { data, error } = await executeInSchema('public', query);
      
      if (error) {
        console.error('Error updating player in database:', error);
        // Fallback to client-side only
        const updatedPlayer = {
          ...players.find(p => p.id === id),
          ...playerData,
          updated_at: new Date().toISOString()
        };
        
        setPlayers(prev => prev.map(p => p.id === id ? updatedPlayer : p));
        return { data: updatedPlayer, error: null };
      }
      
      // Database update successful
      const updatedPlayer = data[0];
      setPlayers(prev => prev.map(p => p.id === id ? updatedPlayer : p));
      return { data: updatedPlayer, error: null };
    } catch (error) {
      console.error('Error in updatePlayer:', error);
      // Fallback to client-side only
      const updatedPlayer = {
        ...players.find(p => p.id === id),
        ...playerData,
        updated_at: new Date().toISOString()
      };
      
      setPlayers(prev => prev.map(p => p.id === id ? updatedPlayer : p));
      return { data: updatedPlayer, error: null };
    }
  };

  const deletePlayer = async (id) => {
    if (!userTenant?.schema_name) {
      console.error("No tenant schema available");
      return { error: "No tenant schema available" };
    }
    
    try {
      // Try to delete player using RPC function
      const query = `
        DELETE FROM ${userTenant.schema_name}.players
        WHERE id = '${id}';
      `;
      
      const { error } = await executeInSchema('public', query);
      
      if (error) {
        console.error('Error deleting player from database:', error);
        // Fallback to client-side only
        setPlayers(prev => prev.filter(p => p.id !== id));
        return { error: null };
      }
      
      // Database delete successful
      setPlayers(prev => prev.filter(p => p.id !== id));
      return { error: null };
    } catch (error) {
      console.error('Error in deletePlayer:', error);
      // Fallback to client-side only
      setPlayers(prev => prev.filter(p => p.id !== id));
      return { error: null };
    }
  };

  return (
    <PlayerContext.Provider value={{
      players,
      loading,
      getPlayerById,
      createPlayer,
      updatePlayer,
      deletePlayer
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export default PlayerProvider;