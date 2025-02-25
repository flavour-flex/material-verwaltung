import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

const PUBLIC_ROUTES = ['/login'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      const isPublicRoute = PUBLIC_ROUTES.includes(router.pathname);

      if (!isAuthenticated && !isPublicRoute) {
        router.replace('/login');
      } else if (isAuthenticated && isPublicRoute) {
        router.replace('/');
      }
    }
  }, [loading, isAuthenticated, router.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Laden...</div>
      </div>
    );
  }

  return <>{children}</>;
} 