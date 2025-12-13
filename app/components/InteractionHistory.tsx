'use client';

import type { Interaction, Event } from '../types/schema';

interface InteractionHistoryProps {
  personId: string;
  interactions: Interaction[];
  events: Event[];
}

export default function InteractionHistory({ personId, interactions, events }: InteractionHistoryProps) {
  // Sort interactions by date (newest first)
  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getEventName = (eventId?: string) => {
    if (!eventId) return null;
    const event = events.find(e => e.id === eventId);
    return event?.name || null;
  };

  if (sortedInteractions.length === 0) {
    return (
      <div className="p-6 border-t border-zinc-800">
        <div className="text-zinc-500 text-sm text-center">
          No interactions recorded yet
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-t border-zinc-800">
      <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
        Interaction History ({sortedInteractions.length})
      </h3>
      <div className="space-y-4">
        {sortedInteractions.map((interaction) => {
          const eventName = getEventName(interaction.event_id);
          
          return (
            <div
              key={interaction.id}
              className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-blue-400 text-sm font-semibold">
                      {new Date(interaction.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    {interaction.type && (
                      <span className="text-zinc-500 text-xs uppercase tracking-wide bg-zinc-700 px-2 py-1 rounded border border-zinc-600">
                        {interaction.type}
                      </span>
                    )}
                    {eventName && (
                      <span className="text-green-400 text-xs bg-green-900/20 px-2 py-1 rounded border border-green-500/30">
                        {eventName}
                      </span>
                    )}
                  </div>
                  {interaction.notes && (
                    <p className="text-zinc-300 text-sm mb-2">{interaction.notes}</p>
                  )}
                  {interaction.location_name && (
                    <div className="text-zinc-500 text-xs flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {interaction.location_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

