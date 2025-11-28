'use client';

import { useState } from 'react';
import type { Person, Event, Organization } from '../types/schema';

interface SidePanelProps {
  people: Person[];
  events: Event[];
  organizations: Organization[];
  onClose?: () => void;
  onAddClick: () => void;
}

type Tab = 'people' | 'events' | 'orgs';

export default function SidePanel({ people, events, organizations, onClose, onAddClick }: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('people');

  return (
    <div className="fixed right-4 top-4 bottom-4 w-full sm:w-96 bg-black/90 backdrop-blur-sm border border-red-500/30 rounded-lg z-50 overflow-hidden flex flex-col shadow-2xl pointer-events-auto">
      {/* Header */}
      <div className="bg-black border-b border-red-500/30 p-4 flex justify-between items-center shrink-0">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveTab('people')}
            className={`text-sm font-bold ${activeTab === 'people' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            People
          </button>
          <button 
            onClick={() => setActiveTab('events')}
            className={`text-sm font-bold ${activeTab === 'events' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Events
          </button>
          <button 
            onClick={() => setActiveTab('orgs')}
            className={`text-sm font-bold ${activeTab === 'orgs' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Orgs
          </button>
        </div>
        <button 
          onClick={onAddClick}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"
        >
          + Add Person
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* PEOPLE LIST */}
        {activeTab === 'people' && (
          people.length === 0 ? (
            <div className="text-zinc-500 text-center mt-10">No people found.</div>
          ) : (
            people.map((person) => (
              <div
                key={person.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-colors p-4 rounded-lg"
              >
                <h3 className="text-white text-lg font-semibold mb-1">{person.name}</h3>
                {person.organizations && person.organizations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {person.organizations.map((org, idx) => (
                      <span key={idx} className="text-red-400 text-xs uppercase tracking-wide bg-red-900/20 px-1.5 py-0.5 rounded">
                        {org.name}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-2 space-y-1">
                  {person.notes && (
                    <p className="text-zinc-400 text-sm">{person.notes}</p>
                  )}
                  <div className="text-zinc-600 text-xs">
                    {person.location_name ? (
                      person.location_name
                    ) : (
                      `${person.current_location_lat.toFixed(2)}, ${person.current_location_lng.toFixed(2)}`
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* EVENTS LIST */}
        {activeTab === 'events' && (
          events.length === 0 ? (
            <div className="text-zinc-500 text-center mt-10">No events found.</div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-colors p-4 rounded-lg"
              >
                <h3 className="text-white text-lg font-semibold mb-1">{event.name}</h3>
                <div className="text-blue-400 text-sm mb-2">
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <p className="text-zinc-400 text-sm">{event.location_name}</p>
              </div>
            ))
          )
        )}

        {/* ORGS LIST */}
        {activeTab === 'orgs' && (
          organizations.length === 0 ? (
            <div className="text-zinc-500 text-center mt-10">No organizations found.</div>
          ) : (
            organizations.map((org) => (
              <div
                key={org.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-green-500/50 transition-colors p-4 rounded-lg"
              >
                <h3 className="text-white text-lg font-semibold mb-1">{org.name}</h3>
                {org.industry && (
                   <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700">
                     {org.industry}
                   </span>
                )}
                {org.website && (
                  <a href={org.website} target="_blank" rel="noreferrer" className="block mt-2 text-green-500 text-sm hover:underline truncate">
                    {org.website}
                  </a>
                )}
              </div>
            ))
          )
        )}

      </div>
    </div>
  );
}
