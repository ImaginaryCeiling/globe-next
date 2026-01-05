import { useQuery } from '@tanstack/react-query';
import type { Person } from '../types/schema';

export function usePeople() {
  return useQuery<Person[]>({
    queryKey: ['people'],
    queryFn: async () => {
      const res = await fetch('/api/people');
      if (!res.ok) throw new Error('Failed to fetch people');
      return res.json();
    },
  });
}

