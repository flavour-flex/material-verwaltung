import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/AuthProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import AuthGuard from '@/components/AuthGuard';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthGuard>
            <Component {...pageProps} />
          </AuthGuard>
          <Toaster position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 