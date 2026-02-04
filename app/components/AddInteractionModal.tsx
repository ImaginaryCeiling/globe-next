'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Person, Event, Interaction } from '../types/schema';

interface AddInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (interaction: Interaction | Interaction[]) => void;
  people: Person[];
  events: Event[];
  eventContext?: Event | null;
  editingInteraction?: Interaction | null;
  interactionTypes?: string[];
  sentiments?: string[];
}

const DEFAULT_INTERACTION_TYPES = ['met', 'call', 'email', 'message', 'introduction', 'other'];
const DEFAULT_SENTIMENTS = ['positive', 'neutral', 'negative'];

export default function AddInteractionModal({
  isOpen, onClose, onSuccess, people, events, eventContext, editingInteraction,
  interactionTypes = DEFAULT_INTERACTION_TYPES,
  sentiments = DEFAULT_SENTIMENTS,
}: AddInteractionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [showPersonDropdown, setShowPersonDropdown] = useState(false);

  const [formData, setFormData] = useState({
    person_id: '',
    person_name: '',
    event_id: '',
    type: 'met',
    notes: '',
    sentiment: '',
    date: '',
    location_name: '',
    location_lat: '',
    location_lng: '',
  });

  useEffect(() => {
    if (editingInteraction) {
      const person = people.find(p => p.id === editingInteraction.person_id);
      setFormData({
        person_id: editingInteraction.person_id || '',
        person_name: person?.name || '',
        event_id: editingInteraction.event_id || '',
        type: editingInteraction.type || 'met',
        notes: editingInteraction.notes || '',
        sentiment: editingInteraction.sentiment || '',
        date: editingInteraction.date ? editingInteraction.date.slice(0, 16) : '',
        location_name: editingInteraction.location_name || '',
        location_lat: editingInteraction.location_lat?.toString() || '',
        location_lng: editingInteraction.location_lng?.toString() || '',
      });
      setPersonSearch(person?.name || '');
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const defaultDate = now.toISOString().slice(0, 16);

      setFormData({
        person_id: '',
        person_name: '',
        event_id: eventContext?.id || '',
        type: 'met',
        notes: '',
        sentiment: '',
        date: eventContext?.date ? eventContext.date.slice(0, 16) : defaultDate,
        location_name: eventContext?.location_name || '',
        location_lat: eventContext?.location_lat?.toString() || '',
        location_lng: eventContext?.location_lng?.toString() || '',
      });
      setPersonSearch('');
    }
  }, [editingInteraction, eventContext, isOpen, people]);

  const filteredPeople = useMemo(() => {
    if (!personSearch) return people;
    const q = personSearch.toLowerCase();
    return people.filter(p => p.name.toLowerCase().includes(q));
  }, [people, personSearch]);

  if (!isOpen) return null;

  const selectPerson = (person: Person) => {
    setFormData(prev => ({ ...prev, person_id: person.id, person_name: person.name }));
    setPersonSearch(person.name);
    setShowPersonDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.person_id) {
      alert('Please select a person');
      return;
    }
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        person_id: formData.person_id,
        type: formData.type,
        date: new Date(formData.date).toISOString(),
      };
      if (formData.event_id) payload.event_id = formData.event_id;
      if (formData.notes) payload.notes = formData.notes;
      if (formData.sentiment) payload.sentiment = formData.sentiment;
      if (formData.location_name) payload.location_name = formData.location_name;
      if (formData.location_lat) payload.location_lat = parseFloat(formData.location_lat);
      if (formData.location_lng) payload.location_lng = parseFloat(formData.location_lng);

      if (editingInteraction) {
        payload.id = editingInteraction.id;
      }

      const res = await fetch('/api/interactions', {
        method: editingInteraction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      onSuccess(result);
      onClose();
    } catch {
      alert(`Failed to ${editingInteraction ? 'update' : 'create'} interaction`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-lg w-full md:max-w-md p-6 max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">
            {editingInteraction ? 'Edit Interaction' : 'Log Interaction'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 -mr-2">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Person selector */}
          <div className="relative">
            <label className="block text-zinc-400 text-sm mb-1">Person</label>
            <input
              type="text"
              required
              placeholder="Search person..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
              value={personSearch}
              onChange={e => {
                setPersonSearch(e.target.value);
                setShowPersonDropdown(true);
                if (!e.target.value) setFormData(prev => ({ ...prev, person_id: '', person_name: '' }));
              }}
              onFocus={() => setShowPersonDropdown(true)}
            />
            {showPersonDropdown && filteredPeople.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded max-h-40 overflow-y-auto">
                {filteredPeople.slice(0, 20).map(person => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => selectPerson(person)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 transition-colors ${
                      formData.person_id === person.id ? 'text-blue-400' : 'text-white'
                    }`}
                  >
                    {person.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Type</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                {interactionTypes.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Sentiment</label>
              <select
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={formData.sentiment}
                onChange={e => setFormData({ ...formData, sentiment: e.target.value })}
              >
                <option value="">None</option>
                {sentiments.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Date</label>
            <input
              type="datetime-local"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* Event selector (optional) */}
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Event (optional)</label>
            <select
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
              value={formData.event_id}
              onChange={e => setFormData({ ...formData, event_id: e.target.value })}
            >
              <option value="">No event</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Notes</label>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none h-20"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingInteraction ? 'Update' : 'Log Interaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
