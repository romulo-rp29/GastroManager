import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Database schema types
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          email: string;
          role: 'doctor' | 'receptionist';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          full_name?: string | null;
          email: string;
          role?: 'doctor' | 'receptionist';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          email?: string;
          role?: 'doctor' | 'receptionist';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Add other tables as needed
    };
  };
}

// Load environment variables
const loadEnv = () => {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  };

  // Validate required environment variables
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    throw new Error('Missing required Supabase environment variables. Please check your .env file.');
  }

  return env;
};

const env = loadEnv();

// Create the main Supabase client for browser usage
export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'gastro-manager/1.0.0'
      }
    }
  }
);

// Create an admin client with service role key for server-side operations
let serviceRoleClient: SupabaseClient<Database> | null = null;

export const getServiceRoleClient = (): SupabaseClient<Database> => {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }
  
  if (!serviceRoleClient) {
    serviceRoleClient = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            'X-Client-Info': 'gastro-manager/admin/1.0.0'
          }
        }
      }
    );
  }
  
  return serviceRoleClient;
};

// Development utilities
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Development mode enabled');
  
  // Add debug logging for Supabase queries
  if (typeof window !== 'undefined') {
    // Expose supabase client globally for debugging in browser console
    // @ts-ignore - This is for development only
    window.supabase = supabase;
  } else {
    console.log('🖥️  Node.js environment detected');
  }
}

// Test the connection when this module is imported
(async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
  }
})();
