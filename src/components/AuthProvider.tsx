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

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userRole: null,
    verantwortlicherStandorte: [],
    isAdmin: false,
    isStandortverantwortlich: false,
    isLoading: true,
    isAuthenticated: false
  });

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setAuthState(prev => ({
          ...prev,
          user: null,
          userRole: null,
          isLoading: false,
          isAuthenticated: false
        }));
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      let verantwortlicherStandorte: string[] = [];
      if (userData?.role === 'standortverantwortlich' && session.user.email) {
        const { data: standorte } = await supabase
          .from('standorte')
          .select('id')
          .contains('verantwortliche', [{ email: session.user.email }]);
        
        if (standorte) {
          verantwortlicherStandorte = standorte.map(s => s.id);
        }
      }

      setAuthState({
        user: session.user,
        userRole: userData?.role || null,
        verantwortlicherStandorte,
        isAdmin: userData?.role === 'admin',
        isStandortverantwortlich: userData?.role === 'standortverantwortlich',
        isLoading: false,
        isAuthenticated: true
      });

    } catch (error) {
      console.error('Error fetching user data:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: false
      }));
    }
  };

  useEffect(() => {
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          userRole: null,
          verantwortlicherStandorte: [],
          isAdmin: false,
          isStandortverantwortlich: false,
          isLoading: false,
          isAuthenticated: false
        });
      } else if (event === 'SIGNED_IN' && session) {
        await fetchUserData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 