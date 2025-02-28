import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: any;
  userRole: string | null;
  verantwortlicherStandorte: string[];
  isAdmin: boolean;
  isStandortverantwortlich: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  verantwortlicherStandorte: [],
  isAdmin: false,
  isStandortverantwortlich: false,
  isLoading: true,
  isAuthenticated: false
});

export const useAuthContext = () => useContext(AuthContext);

const PUBLIC_ROUTES = ['/login', '/auth/set-password'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authState, setAuthState] = useState<AuthContextType>({
    user: null,
    userRole: null,
    verantwortlicherStandorte: [],
    isAdmin: false,
    isStandortverantwortlich: false,
    isLoading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    setAuthState({
      user: session?.user ?? null,
      userRole: session?.user?.role ?? null,
      verantwortlicherStandorte: session?.user?.verantwortlicherStandorte ?? [],
      isAdmin: session?.user?.role === 'ADMIN',
      isStandortverantwortlich: session?.user?.role === 'STANDORT_VERANTWORTLICHER',
      isLoading: false,
      isAuthenticated: !!session
    });

    const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);
    const shouldRedirectToLogin = !session && !isPublicRoute;
    const shouldRedirectToDashboard = session && isPublicRoute;

    if (shouldRedirectToLogin) {
      router.replace('/login').catch(console.error);
    } else if (shouldRedirectToDashboard) {
      router.replace('/').catch(console.error);
    }
  }, [session, status]);

  if (status === 'loading' || authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
} 