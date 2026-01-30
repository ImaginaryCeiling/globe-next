'use client';

import React, { useState } from 'react';
import type { Person, Interaction, Event } from '../types/schema';
import InteractionHistory from './InteractionHistory';

interface CRMPeopleTableProps {
  people: Person[];
  interactions: Interaction[];
  events: Event[];
  sortField: 'name' | 'created_at' | 'last_interaction';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'name' | 'created_at' | 'last_interaction') => void;
  expandedPersonIds: Set<string>;
  onToggleExpanded: (personId: string) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
}

export default function CRMPeopleTable({
  people,
  interactions,
  events,
  sortField,
  sortDirection,
  onSort,
  expandedPersonIds,
  onToggleExpanded,
  onEditPerson,
  onDeletePerson,
}: CRMPeopleTableProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getLastInteraction = (personId: string): Interaction | null => {
    const personInteractions = interactions
      .filter(i => i.person_id === personId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return personInteractions.length > 0 ? personInteractions[0] : null;
  };

  const getSortIcon = (field: 'name' | 'created_at' | 'last_interaction') => {
    if (sortField !== field) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
          <polyline points="8 9 12 5 16 9" />
          <polyline points="8 15 12 19 16 15" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <polyline points="8 9 12 5 16 9" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
        <polyline points="8 15 12 19 16 15" />
      </svg>
    );
  };

  if (people.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500 text-center">
          <p className="text-lg mb-2">No people found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="md:hidden p-4 space-y-3 overflow-y-auto h-full">
        {people.map((person) => {
          const isExpanded = expandedPersonIds.has(person.id);
          const lastInteraction = getLastInteraction(person.id);
          const personInteractions = interactions.filter(i => i.person_id === person.id);

          return (
            <div key={person.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div
                onClick={() => onToggleExpanded(person.id)}
                className="p-4 cursor-pointer active:bg-zinc-800/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base truncate">{person.name}</h3>
                    {person.organizations && person.organizations.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {person.organizations.map((org, idx) => (
                          <span key={idx} className="text-blue-400 text-xs bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                            {org.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-zinc-500 shrink-0 ml-2 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 mt-2">
                  {person.location_name && (
                    <span className="truncate max-w-[200px]">{person.location_name}</span>
                  )}
                  {lastInteraction && (
                    <span>Last: {new Date(lastInteraction.date).toLocaleDateString()}</span>
                  )}
                </div>

                {person.notes && (
                  <p className="text-zinc-500 text-xs mt-2 line-clamp-2">{person.notes}</p>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-zinc-800">
                  {/* Actions */}
                  <div className="flex border-b border-zinc-800">
                    <button
                      onClick={() => onEditPerson(person)}
                      className="flex-1 py-3 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      Edit
                    </button>
                    {confirmDeleteId === person.id ? (
                      <div className="flex flex-1">
                        <button
                          onClick={() => {
                            onDeletePerson(person.id);
                            setConfirmDeleteId(null);
                          }}
                          className="flex-1 py-3 text-sm text-red-500 hover:bg-zinc-800 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 py-3 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(person.id)}
                        className="flex-1 py-3 text-sm text-zinc-400 hover:text-red-500 hover:bg-zinc-800 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  {/* Contact info */}
                  {(person.contact_info?.email || person.contact_info?.phone) && (
                    <div className="px-4 py-3 border-b border-zinc-800 space-y-1">
                      {person.contact_info.email && (
                        <a href={`mailto:${person.contact_info.email}`} className="block text-blue-400 text-sm">
                          {person.contact_info.email}
                        </a>
                      )}
                      {person.contact_info.phone && (
                        <a href={`tel:${person.contact_info.phone}`} className="block text-blue-400 text-sm">
                          {person.contact_info.phone}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Interaction history */}
                  <InteractionHistory
                    interactions={personInteractions}
                    events={events}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto h-full">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
            <tr>
              <th className="text-left p-4 w-12">
                <span className="text-zinc-400 text-xs">Expand</span>
              </th>
              <th className="text-left p-4 min-w-[150px]">
                <button
                  onClick={() => onSort('name')}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-semibold text-base"
                >
                  Name
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="text-left p-4 min-w-[150px] text-zinc-400 font-semibold text-base">Organizations</th>
              <th className="text-left p-4 min-w-[120px] text-zinc-400 font-semibold text-base">Location</th>
              <th className="text-left p-4 min-w-[150px] text-zinc-400 font-semibold text-base">Contact</th>
              <th className="text-left p-4 min-w-[200px] text-zinc-400 font-semibold text-base">Notes</th>
              <th className="text-left p-4 min-w-[130px]">
                <button
                  onClick={() => onSort('last_interaction')}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-semibold text-base"
                >
                  Last Interaction
                  {getSortIcon('last_interaction')}
                </button>
              </th>
              <th className="text-left p-4 min-w-[100px]">
                <button
                  onClick={() => onSort('created_at')}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-semibold text-base"
                >
                  Added
                  {getSortIcon('created_at')}
                </button>
              </th>
              <th className="text-left p-4 w-24 text-zinc-400 font-semibold text-base">Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => {
              const isExpanded = expandedPersonIds.has(person.id);
              const lastInteraction = getLastInteraction(person.id);
              const personInteractions = interactions.filter(i => i.person_id === person.id);

              return (
                <React.Fragment key={person.id}>
                  <tr
                    onClick={() => onToggleExpanded(person.id)}
                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <div
                        className="text-zinc-500 hover:text-white transition-colors"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{person.name}</div>
                    </td>
                    <td className="p-4">
                      {person.organizations && person.organizations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {person.organizations.slice(0, 2).map((org, idx) => (
                            <span
                              key={idx}
                              className="text-blue-400 text-xs uppercase tracking-wide bg-blue-900/20 px-2 py-1 rounded border border-blue-500/30"
                            >
                              {org.name}
                            </span>
                          ))}
                          {person.organizations.length > 2 && (
                            <span className="text-zinc-500 text-xs">+{person.organizations.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm">&mdash;</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-zinc-400 text-sm">
                        {person.location_name || (
                          <span className="text-zinc-600">
                            {person.current_location_lat.toFixed(2)}, {person.current_location_lng.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {person.contact_info?.email && (
                          <div className="text-zinc-400 text-xs truncate max-w-[150px]" title={person.contact_info.email}>
                            {person.contact_info.email}
                          </div>
                        )}
                        {person.contact_info?.phone && (
                          <div className="text-zinc-400 text-xs">{person.contact_info.phone}</div>
                        )}
                        {!person.contact_info?.email && !person.contact_info?.phone && (
                          <span className="text-zinc-600 text-sm">&mdash;</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {person.notes ? (
                        <div className="text-zinc-400 text-sm max-w-[200px] truncate" title={person.notes}>
                          {person.notes}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm">&mdash;</span>
                      )}
                    </td>
                    <td className="p-4">
                      {lastInteraction ? (
                        <div className="text-zinc-400 text-sm">
                          {new Date(lastInteraction.date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm">&mdash;</span>
                      )}
                    </td>
                    <td className="p-4">
                      {person.created_at ? (
                        <div className="text-zinc-400 text-sm">
                          {new Date(person.created_at).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm">&mdash;</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPerson(person);
                          }}
                          className="text-zinc-500 hover:text-white p-1 transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        {confirmDeleteId === person.id ? (
                          <div className="flex items-center gap-1 bg-zinc-800 rounded px-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePerson(person.id);
                                setConfirmDeleteId(null);
                              }}
                              className="text-red-500 hover:text-red-400 text-xs font-bold px-1 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="text-zinc-500 hover:text-zinc-300 text-xs px-1 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(person.id);
                            }}
                            className="text-zinc-500 hover:text-red-500 p-1 transition-colors"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="p-0 bg-zinc-900/50">
                        <InteractionHistory
                          interactions={personInteractions}
                          events={events}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
