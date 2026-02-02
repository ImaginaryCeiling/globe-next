'use client';

import { useState } from 'react';
import type { Interaction, Event } from '../types/schema';

interface InteractionHistoryProps {
  interactions: Interaction[];
  events: Event[];
  onEdit?: (interaction: Interaction) => void;
  onDelete?: (id: string) => void;
}

export default function InteractionHistory({ interactions, events, onEdit, onDelete }: InteractionHistoryProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sortedInteractions = [...interactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getEventName = (eventId?: string) => {
    if (!eventId) return null;
    const event = events.find(e => e.id === eventId);
    return event?.name || null;
  };

  const sentimentColor = (s?: string) => {
    if (s === 'positive') return 'text-green-400 bg-green-900/20 border-green-500/30';
    if (s === 'negative') return 'text-red-400 bg-red-900/20 border-red-500/30';
    if (s === 'neutral') return 'text-zinc-400 bg-zinc-700/30 border-zinc-600/30';
    return '';
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/interactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed');
      setConfirmDeleteId(null);
      onDelete?.(id);
    } catch {
      alert('Failed to delete interaction');
    }
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
              className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 hover:border-blue-500/50 transition-colors group relative"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                    {interaction.sentiment && (
                      <span className={`text-xs px-2 py-1 rounded border ${sentimentColor(interaction.sentiment)}`}>
                        {interaction.sentiment}
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

                {/* Edit/Delete actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(interaction)}
                      className="text-zinc-500 hover:text-white p-1"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    confirmDeleteId === interaction.id ? (
                      <div className="flex items-center gap-1 bg-zinc-800 rounded px-1">
                        <button onClick={() => handleDelete(interaction.id)} className="text-red-500 hover:text-red-400 text-xs font-bold px-1">Confirm</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-zinc-500 hover:text-zinc-300 text-xs px-1">✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(interaction.id)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )
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
