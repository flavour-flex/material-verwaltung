import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 Minute
      refetchOnWindowFocus: true,
      retry: 1,
      retryDelay: 1000,
    },
  },
}); 