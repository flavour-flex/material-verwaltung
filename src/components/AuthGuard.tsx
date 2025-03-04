import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const publicRoutes = ['/login', '/auth/set-password'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !publicRoutes.includes(router.pathname)) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router.pathname]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated && !publicRoutes.includes(router.pathname)) {
    return null;
  }

  return <>{children}</>;
} 