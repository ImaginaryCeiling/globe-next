'use client';

import { useState, useEffect, useRef } from 'react';
import type { Event } from '../types/schema';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (event: Event) => void;
  editingEvent?: Event | null;
}

const EVENT_TYPES = ['conference', 'meetup', 'dinner', 'workshop', 'other'];

export default function AddEventModal({ isOpen, onClose, onSuccess, editingEvent }: AddEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: '',
    date: '',
    end_date: '',
    location_name: '',
    location_lat: '',
    location_lng: '',
    description: '',
  });

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        name: editingEvent.name || '',
        type: editingEvent.type || '',
        date: editingEvent.date ? editingEvent.date.slice(0, 16) : '',
        end_date: editingEvent.end_date ? editingEvent.end_date.slice(0, 16) : '',
        location_name: editingEvent.location_name || '',
        location_lat: editingEvent.location_lat?.toString() || '',
        location_lng: editingEvent.location_lng?.toString() || '',
        description: editingEvent.description || '',
      });
    } else {
      setFormData({
        name: '',
        type: '',
        date: '',
        end_date: '',
        location_name: '',
        location_lat: '',
        location_lng: '',
        description: '',
      });
    }
  }, [editingEvent, isOpen]);

  // Google Places Autocomplete
  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | null = null;

    if (isOpen && locationInputRef.current && (window as { google?: typeof google }).google) {
      const initAutocomplete = async () => {
        try {
          const { Autocomplete } = await (window as { google: typeof google }).google.maps.importLibrary("places") as google.maps.PlacesLibrary;
          autocomplete = new Autocomplete(locationInputRef.current!, {
            fields: ["geometry", "formatted_address", "name"],
            types: ['geocode', 'establishment']
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete!.getPlace();
            if (!place.geometry || !place.geometry.location) return;
            setFormData(prev => ({
              ...prev,
              location_lat: place.geometry!.location!.lat().toString(),
              location_lng: place.geometry!.location!.lng().toString(),
              location_name: place.name || place.formatted_address || '',
            }));
          });
        } catch (e) {
          console.error("Google Maps Places library load error", e);
        }
      };
      initAutocomplete();
    }

    return () => {
      if (autocomplete) {
        (window as { google: typeof google }).google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        date: new Date(formData.date).toISOString(),
        location_name: formData.location_name,
      };
      if (formData.type) payload.type = formData.type;
      if (formData.end_date) payload.end_date = new Date(formData.end_date).toISOString();
      if (formData.description) payload.description = formData.description;
      if (formData.location_lat) payload.location_lat = parseFloat(formData.location_lat);
      if (formData.location_lng) payload.location_lng = parseFloat(formData.location_lng);

      if (editingEvent) {
        payload.id = editingEvent.id;
      }

      const res = await fetch('/api/events', {
        method: editingEvent ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      onSuccess(result);
      onClose();
    } catch {
      alert(`Failed to ${editingEvent ? 'update' : 'create'} event`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-lg w-full md:max-w-md p-6 max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">
            {editingEvent ? 'Edit Event' : 'Add Event'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 -mr-2">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Type</label>
            <select
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="">Select type...</option>
              {EVENT_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Start Date</label>
              <input
                type="datetime-local"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">End Date</label>
              <input
                type="datetime-local"
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Location</label>
            <input
              ref={locationInputRef}
              type="text"
              placeholder="Search for a place..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
              value={formData.location_name}
              onChange={e => {
                setFormData({ ...formData, location_name: e.target.value, location_lat: '', location_lng: '' });
              }}
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Description</label>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none h-24"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
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
              {isSubmitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
