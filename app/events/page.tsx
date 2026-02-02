'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Event, Interaction } from '../types/schema';
import Navigation from '../components/Navigation';
import AddEventModal from '../components/AddEventModal';
import AddInteractionModal from '../components/AddInteractionModal';
import EventDetailModal from '../components/EventDetailModal';
import { useEvents } from '../hooks/useEvents';
import { useInteractions } from '../hooks/useInteractions';
import { usePeople } from '../hooks/usePeople';
import { useQueryClient } from '@tanstack/react-query';
import SplashScreen from '../components/SplashScreen';

export default function EventsPage() {
  const queryClient = useQueryClient();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: interactions = [], isLoading: interactionsLoading } = useInteractions();
  const { data: people = [], isLoading: peopleLoading } = usePeople();

  const [isNavOpen, setIsNavOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', String(isNavOpen));
    }
  }, [isNavOpen]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // Modals
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [interactionModal, setInteractionModal] = useState<{ open: boolean; eventContext?: Event | null }>({ open: false });

  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    const now = Date.now();

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.location_name?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }

    if (typeFilter) {
      filtered = filtered.filter(e => e.type === typeFilter);
    }

    if (timeFilter === 'upcoming') {
      filtered = filtered.filter(e => new Date(e.date).getTime() >= now);
    } else if (timeFilter === 'past') {
      filtered = filtered.filter(e => new Date(e.date).getTime() < now);
    }

    // Sort: upcoming first (ascending), then past (descending)
    filtered.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      const aFuture = aDate >= now;
      const bFuture = bDate >= now;
      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;
      return aFuture ? aDate - bDate : bDate - aDate;
    });

    return filtered;
  }, [events, searchQuery, typeFilter, timeFilter]);

  const eventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.type).filter(Boolean));
    return Array.from(types) as string[];
  }, [events]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['interactions'] });
  };

  if (eventsLoading || interactionsLoading || peopleLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      <Navigation isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />

      <div className={`flex-1 relative h-full transition-all duration-300 ${isNavOpen ? 'md:ml-64' : 'md:ml-16'} pb-16 md:pb-0`}>
        <div className="h-full flex flex-col bg-black">
          {/* Header */}
          <div className="border-b border-zinc-800 p-4 md:p-6 shrink-0">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h1 className="text-white text-2xl md:text-3xl font-bold">Events</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setInteractionModal({ open: true })}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shrink-0 text-sm"
                >
                  Log Interaction
                </button>
                <button
                  onClick={() => setIsAddEventOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shrink-0"
                >
                  + Add Event
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <input
                type="text"
                placeholder="Search events..."
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none flex-1 min-w-[200px]"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="">All types</option>
                {eventTypes.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <select
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                value={timeFilter}
                onChange={e => setTimeFilter(e.target.value as 'all' | 'upcoming' | 'past')}
              >
                <option value="all">All time</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-auto p-4 md:p-6">
            {filteredEvents.length === 0 ? (
              <div className="text-zinc-500 text-center mt-20">No events found.</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map(event => {
                  const count = interactions.filter(i => i.event_id === event.id).length;
                  const isPast = new Date(event.date) < new Date();

                  return (
                    <div
                      key={event.id}
                      onClick={() => { setSelectedEvent(event); setIsDetailOpen(true); }}
                      className={`bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-colors p-5 rounded-lg cursor-pointer ${isPast ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white text-lg font-semibold">{event.name}</h3>
                        {event.type && (
                          <span className="text-xs uppercase tracking-wide text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded shrink-0 ml-2">
                            {event.type}
                          </span>
                        )}
                      </div>
                      <div className="text-blue-400 text-sm mb-1">
                        {new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {event.end_date && (
                          <span className="text-zinc-500">
                            {' '}&ndash; {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                      {event.location_name && (
                        <p className="text-zinc-400 text-sm mb-2">{event.location_name}</p>
                      )}
                      {event.description && (
                        <p className="text-zinc-500 text-xs line-clamp-2 mb-2">{event.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 text-xs">
                          {count} interaction{count !== 1 ? 's' : ''}
                        </span>
                        {isPast && (
                          <span className="text-zinc-600 text-xs">Past</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventOpen || !!editingEvent}
        onClose={() => { setIsAddEventOpen(false); setEditingEvent(null); }}
        onSuccess={() => invalidate()}
        editingEvent={editingEvent}
      />

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedEvent(null); }}
        event={selectedEvent}
        interactions={interactions}
        people={people}
        onEdit={(event) => { setIsDetailOpen(false); setEditingEvent(event); }}
        onDelete={() => invalidate()}
        onAddInteraction={(event) => setInteractionModal({ open: true, eventContext: event })}
        onInteractionsChange={invalidate}
      />

      {/* Add Interaction Modal */}
      <AddInteractionModal
        isOpen={interactionModal.open}
        onClose={() => setInteractionModal({ open: false })}
        onSuccess={() => invalidate()}
        people={people}
        events={events}
        eventContext={interactionModal.eventContext}
      />
    </div>
  );
}
