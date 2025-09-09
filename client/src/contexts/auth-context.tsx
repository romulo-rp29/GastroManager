import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@shared/schema';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<{ error: Error | null }>;
  isLoading: boolean;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and set the user
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Get user profile from your database
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching user profile:', error);
            return;
          }
          
          setUser(userData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    // Check current session on load
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(userData);
      }
      setIsLoading(false);
    };

    checkUser();
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      console.error('Login error:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.name,
            // Add other user data as needed
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create user profile in your database
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email,
              name: userData.name,
              role: userData.role || 'user',
              // Add other user fields
            },
          ]);

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    return { error };
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    signUp
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
