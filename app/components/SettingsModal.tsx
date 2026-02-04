'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  usePreferences,
  DEFAULT_INTERACTION_TYPES,
  DEFAULT_EVENT_TYPES,
  DEFAULT_SENTIMENTS,
} from '@/app/hooks/usePreferences';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { signOut } = useAuth();
  const { interactionTypes, eventTypes, sentiments } = usePreferences();
  const queryClient = useQueryClient();

  if (!isOpen) return null;

  const savePreference = async (key: string, value: string[]) => {
    await fetch('/api/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    queryClient.invalidateQueries({ queryKey: ['preferences'] });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-lg w-full md:max-w-lg p-6 max-h-[92vh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 -mr-2">✕</button>
        </div>

        <div className="space-y-6">
          <PreferenceSection
            title="Interaction Types"
            items={interactionTypes}
            defaultItems={DEFAULT_INTERACTION_TYPES}
            onSave={(items) => savePreference('interaction_types', items)}
          />

          <PreferenceSection
            title="Event Types"
            items={eventTypes}
            defaultItems={DEFAULT_EVENT_TYPES}
            onSave={(items) => savePreference('event_types', items)}
          />

          <PreferenceSection
            title="Sentiment Labels"
            items={sentiments}
            defaultItems={DEFAULT_SENTIMENTS}
            onSave={(items) => savePreference('sentiments', items)}
          />

          <div className="pt-4 border-t border-zinc-800">
            <button
              onClick={signOut}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-red-400 font-semibold py-2.5 px-4 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceSection({
  title,
  items,
  defaultItems,
  onSave,
}: {
  title: string;
  items: string[];
  defaultItems: string[];
  onSave: (items: string[]) => void;
}) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    const trimmed = newItem.trim().toLowerCase();
    if (!trimmed || items.includes(trimmed)) return;
    onSave([...items, trimmed]);
    setNewItem('');
  };

  const handleRemove = (item: string) => {
    onSave(items.filter(i => i !== item));
  };

  const handleReset = () => {
    onSave(defaultItems);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white text-sm font-semibold">{title}</h3>
        <button
          onClick={handleReset}
          className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
        >
          Reset to defaults
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {items.map(item => (
          <span
            key={item}
            className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-white text-sm px-2.5 py-1 rounded-lg"
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
            <button
              onClick={() => handleRemove(item)}
              className="text-zinc-500 hover:text-red-400 ml-0.5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder={`Add ${title.toLowerCase().replace(/s$/, '')}...`}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-white text-sm focus:border-blue-500 outline-none"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        />
        <button
          onClick={handleAdd}
          className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm px-3 py-1.5 rounded transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
