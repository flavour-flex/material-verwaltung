import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: any | null;
  userRole: string | null;
  verantwortlicherStandorte: string[];
  isAdmin: boolean;
  isStandortverantwortlich: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  userRole: null,
  verantwortlicherStandorte: [],
  isAdmin: false,
  isStandortverantwortlich: false,
  isLoading: true,
  isAuthenticated: false,
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userRole: null,
    verantwortlicherStandorte: [],
    isAdmin: false,
    isStandortverantwortlich: false,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          if (router.pathname !== '/login' && router.pathname !== '/auth/set-password') {
            router.replace('/login');
          }
          return;
        }

        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        setAuthState({
          user: session.user,
          userRole: userData?.role || null,
          verantwortlicherStandorte: userData?.verantwortlicher_standorte || [],
          isAdmin: userData?.role === 'ADMIN',
          isStandortverantwortlich: userData?.role === 'STANDORT_VERANTWORTLICHER',
          isLoading: false,
          isAuthenticated: true
        });

        if (router.pathname === '/login') {
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(fetchUserData);

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 