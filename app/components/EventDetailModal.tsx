'use client';

import { useState } from 'react';
import type { Event, Interaction, Person } from '../types/schema';
import BatchInteractionLogger from './BatchInteractionLogger';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  interactions: Interaction[];
  people: Person[];
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  onAddInteraction: (event: Event) => void;
  onInteractionsChange: () => void;
}

export default function EventDetailModal({
  isOpen, onClose, event, interactions, people,
  onEdit, onDelete, onAddInteraction, onInteractionsChange,
}: EventDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showBatchLogger, setShowBatchLogger] = useState(false);
  const [deletingInteractionId, setDeletingInteractionId] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const eventInteractions = interactions.filter(i => i.event_id === event.id);
  const isPast = new Date(event.date) < new Date();

  const handleDeleteEvent = async () => {
    try {
      const res = await fetch('/api/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id }),
      });
      if (!res.ok) throw new Error('Failed');
      onDelete(event.id);
      onClose();
    } catch {
      alert('Failed to delete event');
    }
  };

  const handleDeleteInteraction = async (id: string) => {
    try {
      const res = await fetch('/api/interactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed');
      setDeletingInteractionId(null);
      onInteractionsChange();
    } catch {
      alert('Failed to delete interaction');
    }
  };

  const sentimentColor = (s?: string) => {
    if (s === 'positive') return 'text-green-400 bg-green-900/20 border-green-500/30';
    if (s === 'negative') return 'text-red-400 bg-red-900/20 border-red-500/30';
    if (s === 'neutral') return 'text-zinc-400 bg-zinc-700/30 border-zinc-600/30';
    return '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-lg w-full md:max-w-lg p-6 h-[85vh] md:h-auto md:max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <h2 className="text-white text-2xl font-bold">{event.name}</h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {event.type && (
                <span className="text-xs uppercase tracking-wide text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                  {event.type}
                </span>
              )}
              <span className="text-blue-400 text-sm">
                {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              {event.end_date && (
                <span className="text-zinc-500 text-sm">
                  &ndash; {new Date(event.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(event)}
              className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded transition-colors"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Location */}
        {event.location_name && (
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            {event.location_name}
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-zinc-300 text-sm mb-4 whitespace-pre-wrap">{event.description}</p>
        )}

        {/* Interactions Section */}
        <div className="border-t border-zinc-800 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-zinc-500 text-xs uppercase tracking-wider">
              Interactions ({eventInteractions.length})
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => onAddInteraction(event)}
                className="text-blue-400 hover:text-blue-300 text-xs font-medium"
              >
                + Add
              </button>
              {isPast && (
                <button
                  onClick={() => setShowBatchLogger(!showBatchLogger)}
                  className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                >
                  {showBatchLogger ? 'Hide Batch' : 'Batch Log'}
                </button>
              )}
            </div>
          </div>

          {showBatchLogger && (
            <div className="mb-4 border border-zinc-700 rounded-lg p-3">
              <BatchInteractionLogger
                event={event}
                people={people}
                onSuccess={() => {
                  setShowBatchLogger(false);
                  onInteractionsChange();
                }}
                onClose={() => setShowBatchLogger(false)}
              />
            </div>
          )}

          {eventInteractions.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">No interactions logged for this event</p>
          ) : (
            <div className="space-y-2">
              {eventInteractions.map(interaction => {
                const person = people.find(p => p.id === interaction.person_id);
                return (
                  <div key={interaction.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 group relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{person?.name || 'Unknown'}</span>
                        <span className="text-zinc-500 text-xs uppercase tracking-wide bg-zinc-700 px-1.5 py-0.5 rounded border border-zinc-600">
                          {interaction.type}
                        </span>
                        {interaction.sentiment && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${sentimentColor(interaction.sentiment)}`}>
                            {interaction.sentiment}
                          </span>
                        )}
                      </div>
                      {/* Delete button */}
                      {deletingInteractionId === interaction.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteInteraction(interaction.id)}
                            className="text-red-500 hover:text-red-400 text-xs font-bold px-1"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingInteractionId(null)}
                            className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingInteractionId(interaction.id)}
                          className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {interaction.notes && (
                      <p className="text-zinc-400 text-xs mt-1">{interaction.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-zinc-800 flex justify-between items-center">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-sm">Delete this event?</span>
              <button onClick={handleDeleteEvent} className="text-red-500 hover:text-red-400 text-sm font-bold">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-zinc-500 hover:text-zinc-300 text-sm">No</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-zinc-500 hover:text-red-400 text-sm">
              Delete Event
            </button>
          )}
          <button
            onClick={() => onEdit(event)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded transition-colors"
          >
            Edit Event
          </button>
        </div>
      </div>
    </div>
  );
}
