import { useQuery } from '@tanstack/react-query';
import { standortService } from '@/services/api/standortService';

export function useStandorte() {
  return useQuery({
    queryKey: ['standorte'],
    queryFn: () => standortService.getStandorte()
  });
}

export function useStandort(id: string) {
  return useQuery({
    queryKey: ['standort', id],
    queryFn: () => standortService.getStandort(id),
    enabled: !!id
  });
} 