'use client';

import { useState, useMemo } from 'react';
import type { Person, Event, Interaction } from '../types/schema';

interface BatchInteractionLoggerProps {
  event: Event;
  people: Person[];
  onSuccess: (interactions: Interaction[]) => void;
  onClose: () => void;
}

const INTERACTION_TYPES = ['met', 'call', 'email', 'message', 'introduction', 'other'];

interface Row {
  id: number;
  person_id: string;
  personSearch: string;
  type: string;
  notes: string;
  sentiment: string;
}

let rowIdCounter = 0;

export default function BatchInteractionLogger({ event, people, onSuccess, onClose }: BatchInteractionLoggerProps) {
  const [rows, setRows] = useState<Row[]>([
    { id: ++rowIdCounter, person_id: '', personSearch: '', type: 'met', notes: '', sentiment: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const addRow = () => {
    setRows([...rows, { id: ++rowIdCounter, person_id: '', personSearch: '', type: 'met', notes: '', sentiment: '' }]);
  };

  const removeRow = (id: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: keyof Row, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const selectPerson = (rowId: number, person: Person) => {
    setRows(rows.map(r => r.id === rowId ? { ...r, person_id: person.id, personSearch: person.name } : r));
    setActiveDropdown(null);
  };

  const handleSubmit = async () => {
    const validRows = rows.filter(r => r.person_id);
    if (validRows.length === 0) {
      alert('Add at least one person');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = validRows.map(r => ({
        person_id: r.person_id,
        event_id: event.id,
        type: r.type,
        notes: r.notes || undefined,
        sentiment: r.sentiment || undefined,
        date: event.date,
        location_name: event.location_name,
        location_lat: event.location_lat,
        location_lng: event.location_lng,
      }));

      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed');
      const result = await res.json();
      onSuccess(result);
      onClose();
    } catch {
      alert('Failed to create interactions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold text-sm">Batch Log Interactions</h3>
        <button
          onClick={addRow}
          className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          + Add Row
        </button>
      </div>

      {rows.map((row) => (
        <BatchRow
          key={row.id}
          row={row}
          people={people}
          isDropdownOpen={activeDropdown === row.id}
          onOpenDropdown={() => setActiveDropdown(row.id)}
          onCloseDropdown={() => setActiveDropdown(null)}
          onUpdate={updateRow}
          onSelectPerson={selectPerson}
          onRemove={() => removeRow(row.id)}
          canRemove={rows.length > 1}
        />
      ))}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onClose}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 px-4 rounded transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || rows.every(r => !r.person_id)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 text-sm"
        >
          {isSubmitting ? 'Saving...' : `Log ${rows.filter(r => r.person_id).length} Interaction(s)`}
        </button>
      </div>
    </div>
  );
}

function BatchRow({
  row, people, isDropdownOpen, onOpenDropdown, onCloseDropdown,
  onUpdate, onSelectPerson, onRemove, canRemove
}: {
  row: Row;
  people: Person[];
  isDropdownOpen: boolean;
  onOpenDropdown: () => void;
  onCloseDropdown: () => void;
  onUpdate: (id: number, field: keyof Row, value: string) => void;
  onSelectPerson: (rowId: number, person: Person) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const filtered = useMemo(() => {
    if (!row.personSearch) return people;
    const q = row.personSearch.toLowerCase();
    return people.filter(p => p.name.toLowerCase().includes(q));
  }, [people, row.personSearch]);

  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 space-y-2">
      <div className="flex gap-2">
        {/* Person search */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Person..."
            className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
            value={row.personSearch}
            onChange={e => {
              onUpdate(row.id, 'personSearch', e.target.value);
              onUpdate(row.id, 'person_id', '');
              onOpenDropdown();
            }}
            onFocus={onOpenDropdown}
          />
          {isDropdownOpen && filtered.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded max-h-32 overflow-y-auto">
              {filtered.slice(0, 10).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPerson(row.id, p)}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-700 text-white"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Type */}
        <select
          className="bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none w-24"
          value={row.type}
          onChange={e => onUpdate(row.id, 'type', e.target.value)}
        >
          {INTERACTION_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>

        {canRemove && (
          <button
            onClick={onRemove}
            className="text-zinc-500 hover:text-red-400 p-1 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Notes (optional)..."
        className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-sm focus:border-blue-500 outline-none"
        value={row.notes}
        onChange={e => onUpdate(row.id, 'notes', e.target.value)}
      />
    </div>
  );
}
