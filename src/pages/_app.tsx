import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';
import AuthProvider from '@/components/AuthProvider';
import ErrorBoundary from '@/components/ErrorBoundary';

// QueryClient außerhalb der Komponente erstellen
const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
} 