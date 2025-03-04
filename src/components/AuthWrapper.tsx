'use client';

import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from './ui/LoadingSpinner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
} 