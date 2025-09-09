import { createClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    env: {
      SUPABASE_URL: string;
      SUPABASE_KEY: string;
    };
  }
}

// Carregar variáveis de ambiente
const loadEnv = () => {
  if (typeof process !== 'undefined' && process.env) {
    // Node.js
    return {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || ''
    };
  } else if (typeof window !== 'undefined' && window.env) {
    // Navegador com variáveis injetadas
    return {
      supabaseUrl: window.env.SUPABASE_URL,
      supabaseKey: window.env.SUPABASE_KEY
    };
  }
  
  throw new Error('Ambiente não suportado para carregar variáveis de ambiente');
};

const { supabaseUrl, supabaseKey } = loadEnv();

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_KEY são obrigatórios no .env');
}

// Configuração do cliente Supabase
const supabaseClientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'gastromanager-session',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 
      'x-application-name': 'GastroManager',
      'x-app-version': '1.0.0',
    },
  },
} as const;

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey, supabaseClientOptions);

// Ativar logs em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Modo de desenvolvimento ativado');
  
  // Verificar se estamos no navegador antes de acessar window
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.supabase = supabase; // Para depuração no navegador
  } else {
    console.log('🖥️  Ambiente Node.js detectado');
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
