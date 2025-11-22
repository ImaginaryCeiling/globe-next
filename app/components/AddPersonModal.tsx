'use client';

import { useState } from 'react';
import type { Profile } from '../types/profile';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: Profile) => void;
}

export default function AddPersonModal({ isOpen, onClose, onSuccess }: AddPersonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lng: '',
    met_at: '',
    met_on: new Date().toISOString().split('T')[0],
    notes: '',
    tags: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const profileData = {
        ...formData,
        location: [parseFloat(formData.lat), parseFloat(formData.lng)],
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      if (!res.ok) throw new Error('Failed to add profile');

      const newProfile = await res.json();
      onSuccess(newProfile);
      onClose();
      // Reset form
      setFormData({
        name: '',
        lat: '',
        lng: '',
        met_at: '',
        met_on: new Date().toISOString().split('T')[0],
        notes: '',
        tags: ''
      });
    } catch (error) {
      console.error(error);
      alert('Failed to add person');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">Add New Person</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Name</label>
            <input
              type="text"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
                value={formData.lat}
                onChange={e => setFormData({...formData, lat: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
                value={formData.lng}
                onChange={e => setFormData({...formData, lng: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Met At (Location Name)</label>
            <input
              type="text"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
              value={formData.met_at}
              onChange={e => setFormData({...formData, met_at: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Date Met</label>
            <input
              type="date"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
              value={formData.met_on}
              onChange={e => setFormData({...formData, met_on: e.target.value})}
            />
          </div>

           <div>
            <label className="block text-zinc-400 text-sm mb-1">Tags (comma separated)</label>
            <input
              type="text"
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
              placeholder="tech, friend, sf"
              value={formData.tags}
              onChange={e => setFormData({...formData, tags: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Notes</label>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none h-24"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Person'}
          </button>
        </form>
      </div>
    </div>
  );
}

