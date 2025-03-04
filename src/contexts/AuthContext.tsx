import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  role?: string;
  verantwortlicheStandorte?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isStandortverantwortlich: boolean;
  verantwortlicheStandorte: string[];
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [verantwortlicheStandorte, setVerantwortlicheStandorte] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  async function handleUser(authUser: User | null) {
    if (authUser) {
      try {
        // Fetch user role and responsibilities
        const { data: userData, error } = await supabase
          .from('users')
          .select(`
            role,
            verantwortliche_standorte
          `)
          .eq('id', authUser.id)
          .single();

        if (error) throw error;

        if (userData) {
          // Wenn Standortverantwortlicher, hole Standort-Details
          if (userData.role === 'standortverantwortlich') {
            const { data: standorte, error: standortError } = await supabase
              .from('standorte')
              .select('id')
              .filter('verantwortliche', 'cs', `[{"email": "${authUser.email}"}]`);

            if (standortError) throw standortError;

            setVerantwortlicheStandorte(standorte?.map(s => s.id) || []);
          }

          setUser({ 
            ...authUser, 
            role: userData.role,
            verantwortlicheStandorte: userData.verantwortliche_standorte 
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(authUser);
      }
    } else {
      setUser(null);
      setVerantwortlicheStandorte([]);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUser(session?.user || null);
    });

    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      handleUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { data: userData, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (roleError) throw roleError;

      // Weiterleitung basierend auf Rolle
      if (userData.role === 'admin') {
        router.push('/dashboard');
      } else if (userData.role === 'standortverantwortlich') {
        router.push('/standorte');
      } else {
        router.push('/bestellungen/neu');
      }

    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.role === 'admin',
      isStandortverantwortlich: user?.role === 'standortverantwortlich',
      verantwortlicheStandorte,
      isLoading,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 