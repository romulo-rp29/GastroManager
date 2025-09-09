import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';

// Types for our database schema
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
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Type for the Supabase client with database schema
export type SupabaseClient = SupabaseClientType<Database>;

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
let serviceRoleClient: SupabaseClient | null = null;

export const getServiceRoleClient = (): SupabaseClient => {
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

// Enable debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Development mode enabled');
  
  // Add debug logging for Supabase queries
  if (typeof window !== 'undefined') {
    // Only modify the client in browser environment
    const originalFrom = supabase.from;
    // @ts-ignore - We're intentionally extending the client for debugging
    supabase.from = function(table: string) {
      console.log(`[Supabase] Querying table: ${table}`);
      return originalFrom.call(this, table);
    };
    
    // Expose supabase client globally for debugging in browser console
    // @ts-ignore - This is for development only
    window.supabase = supabase;
  } else {
    console.log('🖥️  Node.js environment detected');
  }
}
}

// Testar a conexão
(async () => {
  try {
    console.log('🔍 Testando conexão com o Supabase...');
    console.log(`- URL: ${supabaseUrl.substring(0, 30)}...`);
    console.log(`- Chave: ${supabaseKey.substring(0, 10)}...`);
    
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error('❌ Erro na consulta ao Supabase:');
      console.error('- Código:', error.code);
      console.error('- Mensagem:', error.message);
      console.error('- Detalhes:', error.details);
      console.error('- Dica:', error.hint);
      throw error;
    }
    
    console.log('✅ Conectado ao Supabase com sucesso!');
    console.log(`- Total de usuários encontrados: ${data?.length || 0}`);
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:');
    if (error instanceof Error) {
      console.error('- Nome:', error.name);
      console.error('- Mensagem:', error.message);
      console.error('- Stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
    } else {
      console.error('Erro desconhecido:', error);
    }
    console.error('\n🔧 Solução de problemas:');
    console.error('1. Verifique se as variáveis de ambiente estão corretas no arquivo .env');
    console.error('2. Verifique se o Supabase está online e acessível');
    console.error('3. Verifique se a chave de API tem permissões adequadas');
    console.error('4. Verifique se as tabelas foram criadas no Supabase');
    
    process.exit(1);
  }
})();
