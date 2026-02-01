'use client';

import { useState } from 'react';
import type { Person, Event, Organization } from '../types/schema';
import PersonDetailModal from './PersonDetailModal';

interface SidePanelProps {
  people: Person[];
  events: Event[];
  organizations: Organization[];
  onClose?: () => void;
  onAddClick: () => void;
  onEditPerson?: (person: Person) => void;
  onDeletePerson?: (id: string) => void;
}

type Tab = 'people' | 'events' | 'orgs';

export default function SidePanel({ people, events, organizations, onAddClick, onEditPerson, onDeletePerson }: SidePanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('people');
  const [isExpanded, setIsExpanded] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedOrgIds, setExpandedOrgIds] = useState<Set<string>>(new Set());
  // Mobile bottom sheet: 'collapsed' (peek), 'half', 'full'
  const [sheetMode, setSheetMode] = useState<'collapsed' | 'half' | 'full'>('collapsed');
  // Person detail modal state
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handlePersonClick = (person: Person) => {
    setSelectedPerson(person);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedPerson(null);
  };

  const handleEditFromModal = (person: Person) => {
    if (onEditPerson) {
      onEditPerson(person);
    }
  };

  // Desktop collapsed state
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed right-4 top-4 bg-black/90 backdrop-blur-sm border border-blue-500/30 text-white p-3 rounded-lg shadow-2xl z-40 hover:bg-zinc-900 transition-all hidden md:block"
        aria-label="Expand side panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
      </button>
    );
  }

  const mobileSheetHeight = sheetMode === 'full' ? 'h-[85vh]' : sheetMode === 'half' ? 'h-[45vh]' : 'h-20';

  const cycleSheet = () => {
    if (sheetMode === 'collapsed') setSheetMode('half');
    else if (sheetMode === 'half') setSheetMode('full');
    else setSheetMode('collapsed');
  };

  const contentList = (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">

      {/* PEOPLE LIST */}
      {activeTab === 'people' && (
        people.length === 0 ? (
          <div className="text-zinc-500 text-center mt-10">No people found.</div>
        ) : (
          people.map((person) => (
            <div
              key={person.id}
              onClick={() => handlePersonClick(person)}
              className="bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 transition-colors p-4 rounded-lg relative group cursor-pointer"
            >
              {/* Actions (Top Right) */}
              <div className="absolute top-2 right-2 flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPerson && onEditPerson(person);
                  }}
                  className="text-zinc-500 hover:text-white p-1"
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
                        onDeletePerson?.(person.id);
                        setConfirmDeleteId(null);
                      }}
                      className="text-red-500 hover:text-red-400 text-xs font-bold px-1"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                      className="text-zinc-500 hover:text-zinc-300 text-xs px-1"
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
                    className="text-zinc-500 hover:text-blue-500 p-1"
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

              <h3 className="text-white text-lg font-semibold mb-1 pr-16">{person.name}</h3>
              {person.organizations && person.organizations.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {person.organizations.map((org, idx) => (
                    <span key={idx} className="text-blue-400 text-xs uppercase tracking-wide bg-blue-900/20 px-1.5 py-0.5 rounded">
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
          organizations.map((org) => {
            const isOrgExpanded = expandedOrgIds.has(org.id);
            const orgPeople = people.filter(person =>
              person.organizations?.some(o => o.id === org.id)
            );

            const toggleOrg = () => {
              setExpandedOrgIds(prev => {
                const newSet = new Set(prev);
                if (isOrgExpanded) {
                  newSet.delete(org.id);
                } else {
                  newSet.add(org.id);
                }
                return newSet;
              });
            };

            return (
              <div
                key={org.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-green-500/50 transition-colors rounded-lg overflow-hidden"
              >
                <div
                  onClick={toggleOrg}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white text-lg font-semibold mb-1">{org.name}</h3>
                      {org.industry && (
                        <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded border border-zinc-700">
                          {org.industry}
                        </span>
                      )}
                      {org.website && (
                        <a
                          href={org.website}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="block mt-2 text-green-500 text-sm hover:underline truncate"
                        >
                          {org.website}
                        </a>
                      )}
                      <div className="text-zinc-500 text-xs mt-2">
                        {orgPeople.length} {orgPeople.length === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`text-zinc-500 transition-transform ${isOrgExpanded ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>
                </div>

                {isOrgExpanded && orgPeople.length > 0 && (
                  <div className="border-t border-zinc-800 p-4 space-y-3">
                    {orgPeople.map((person) => (
                      <div
                        key={person.id}
                        className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 hover:border-green-500/50 transition-colors"
                      >
                        <h4 className="text-white font-medium mb-1">{person.name}</h4>
                        {person.notes && (
                          <p className="text-zinc-400 text-sm mb-1">{person.notes}</p>
                        )}
                        <div className="text-zinc-600 text-xs">
                          {person.location_name ? (
                            person.location_name
                          ) : (
                            `${person.current_location_lat.toFixed(2)}, ${person.current_location_lng.toFixed(2)}`
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )
      )}
    </div>
  );

  const tabBar = (
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
  );

  return (
    <>
      {/* Desktop: right side panel */}
      <div className="hidden md:flex fixed right-4 top-4 bottom-4 w-96 bg-black/90 backdrop-blur-sm border border-blue-500/30 rounded-lg z-40 overflow-hidden flex-col shadow-2xl pointer-events-auto">
        {/* Header */}
        <div className="bg-black border-b border-blue-500/30 p-4 flex justify-between items-center shrink-0">
          {tabBar}
          <div className="flex gap-2 items-center">
            <button
              onClick={onAddClick}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"
            >
              + Add
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-500 hover:text-white transition-colors"
              aria-label="Collapse side panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
        {contentList}
      </div>

      {/* Mobile: bottom sheet */}
      <div className={`md:hidden fixed bottom-16 left-0 right-0 bg-black/95 backdrop-blur-sm border-t border-blue-500/30 rounded-t-2xl z-40 flex flex-col transition-all duration-300 ease-out pointer-events-auto ${mobileSheetHeight}`}>
        {/* Drag handle + header */}
        <div
          onClick={cycleSheet}
          className="cursor-pointer shrink-0"
        >
          <div className="flex justify-center py-2">
            <div className="w-10 h-1 bg-zinc-600 rounded-full" />
          </div>
          <div className="px-4 pb-3 flex justify-between items-center">
            {tabBar}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddClick();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Content — only show when not collapsed */}
        {sheetMode !== 'collapsed' && contentList}
      </div>

      {/* Person Detail Modal */}
      <PersonDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        person={selectedPerson}
        onEdit={handleEditFromModal}
      />
    </>
  );
}
