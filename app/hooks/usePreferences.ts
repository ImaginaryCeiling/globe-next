import { useQuery } from '@tanstack/react-query';

export const DEFAULT_INTERACTION_TYPES = ['met', 'call', 'email', 'message', 'introduction', 'other'];
export const DEFAULT_EVENT_TYPES = ['conference', 'meetup', 'dinner', 'workshop', 'other'];
export const DEFAULT_SENTIMENTS = ['positive', 'neutral', 'negative'];

interface Preference {
  key: string;
  value: string[];
}

export function usePreferences() {
  const query = useQuery<Preference[]>({
    queryKey: ['preferences'],
    queryFn: async () => {
      const res = await fetch('/api/preferences');
      if (!res.ok) throw new Error('Failed to fetch preferences');
      return res.json();
    },
  });

  const getPreference = (key: string, defaultValue: string[]): string[] => {
    const pref = query.data?.find(p => p.key === key);
    return pref ? pref.value : defaultValue;
  };

  return {
    ...query,
    getPreference,
    interactionTypes: getPreference('interaction_types', DEFAULT_INTERACTION_TYPES),
    eventTypes: getPreference('event_types', DEFAULT_EVENT_TYPES),
    sentiments: getPreference('sentiments', DEFAULT_SENTIMENTS),
  };
}
