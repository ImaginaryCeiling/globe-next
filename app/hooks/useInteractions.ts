import { useQuery } from '@tanstack/react-query';
import type { Interaction } from '../types/schema';

export function useInteractions() {
  return useQuery<Interaction[]>({
    queryKey: ['interactions'],
    queryFn: async () => {
      const res = await fetch('/api/interactions');
      if (!res.ok) throw new Error('Failed to fetch interactions');
      return res.json();
    },
  });
}

