import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
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

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { data: session, status } = useSession();
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
    const initAuth = async () => {
      if (status === 'loading') return;

      if (!session) {
        if (!router.pathname.startsWith('/login')) {
          router.push('/login');
        }
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user?.email)
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

      } catch (error) {
        console.error('Error fetching user data:', error);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, [session, status, router]);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 