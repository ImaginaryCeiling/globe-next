'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Person } from '../types/schema';
import Navigation from '../components/Navigation';
import AddPersonModal from '../components/AddPersonModal';
import EditPersonModal from '../components/EditPersonModal';
import AddInteractionModal from '../components/AddInteractionModal';
import PRMPeopleTable from '../components/PRMPeopleTable';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import { usePeople } from '../hooks/usePeople';
import { useEvents } from '../hooks/useEvents';
import { useOrganizations } from '../hooks/useOrganizations';
import { useInteractions } from '../hooks/useInteractions';
import { useQueryClient } from '@tanstack/react-query';
import SplashScreen from '../components/SplashScreen';

type SortField = 'name' | 'created_at' | 'last_interaction';
type SortDirection = 'asc' | 'desc';

export default function prmPage() {
  const queryClient = useQueryClient();
  
  // Use TanStack Query hooks - data is now cached!
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: organizations = [], isLoading: orgsLoading } = useOrganizations();
  const { data: interactions = [], isLoading: interactionsLoading } = useInteractions();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarOpen');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  // Persist sidebar state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', String(isNavOpen));
    }
  }, [isNavOpen]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<{ start?: string; end?: string }>({});
  
  // Sort state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Expanded rows for interaction history
  const [expandedPersonIds, setExpandedPersonIds] = useState<Set<string>>(new Set());

  // Filter and sort people
  const filteredAndSortedPeople = useMemo(() => {
    let filtered = [...people];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(query) ||
        person.notes?.toLowerCase().includes(query) ||
        person.contact_info?.email?.toLowerCase().includes(query) ||
        person.contact_info?.phone?.toLowerCase().includes(query) ||
        person.contact_info?.linkedin?.toLowerCase().includes(query)
      );
    }

    // Apply organization filter
    if (selectedOrgIds.length > 0) {
      filtered = filtered.filter(person =>
        person.organizations?.some(org => selectedOrgIds.includes(org.id))
      );
    }

    // Apply date filter (last interaction)
    if (dateFilter.start || dateFilter.end) {
      filtered = filtered.filter(person => {
        const personInteractions = interactions.filter(i => i.person_id === person.id);
        if (personInteractions.length === 0) return false;
        
        const lastInteraction = personInteractions.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        
        const interactionDate = new Date(lastInteraction.date);
        if (dateFilter.start && interactionDate < new Date(dateFilter.start)) return false;
        if (dateFilter.end && interactionDate > new Date(dateFilter.end)) return false;
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      if (sortField === 'name') {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      } else if (sortField === 'created_at') {
        aValue = new Date(a.created_at || 0).getTime();
        bValue = new Date(b.created_at || 0).getTime();
      } else if (sortField === 'last_interaction') {
        const aInteractions = interactions.filter(i => i.person_id === a.id);
        const bInteractions = interactions.filter(i => i.person_id === b.id);
        aValue = aInteractions.length > 0 
          ? new Date(aInteractions.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0].date).getTime()
          : 0;
        bValue = bInteractions.length > 0
          ? new Date(bInteractions.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0].date).getTime()
          : 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [people, searchQuery, selectedOrgIds, dateFilter, sortField, sortDirection, interactions]);

  const handleAddSuccess = () => {
    // Invalidate and refetch people data
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  const handleEditSuccess = () => {
    // Invalidate and refetch people data
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  const handleDeletePerson = async (id: string) => {
    try {
      const res = await fetch(`/api/people/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      
      // Invalidate and refetch people and interactions data
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    } catch (err) {
      console.error(err);
      alert('Failed to delete person');
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleExpanded = (personId: string) => {
    setExpandedPersonIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personId)) {
        newSet.delete(personId);
      } else {
        newSet.add(personId);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedOrgIds([]);
    setDateFilter({});
  };

  // Show loading state if any data is loading
  if (peopleLoading || eventsLoading || orgsLoading || interactionsLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      {/* Left Navigation */}
      <Navigation isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />

      
      {/* Main Content Area */}
      <div className={`flex-1 relative h-full transition-all duration-300 ${isNavOpen ? 'md:ml-64' : 'md:ml-16'} pb-16 md:pb-0`}>
        <div className="h-full flex flex-col bg-black">
          {/* Header */}
          <div className="border-b border-zinc-800 p-4 md:p-6 shrink-0">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h1 className="text-white text-2xl md:text-3xl font-bold">PRM</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsInteractionModalOpen(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shrink-0 text-sm"
                >
                  Log Interaction
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors shrink-0"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-3">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
              />
              <FilterPanel
                organizations={organizations}
                selectedOrgIds={selectedOrgIds}
                onOrgFilterChange={setSelectedOrgIds}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                onClearFilters={clearFilters}
                hasActiveFilters={!!(searchQuery || selectedOrgIds.length > 0 || dateFilter.start || dateFilter.end)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
              <PRMPeopleTable
              people={filteredAndSortedPeople}
              interactions={interactions}
              events={events}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              expandedPersonIds={expandedPersonIds}
              onToggleExpanded={toggleExpanded}
              onEditPerson={setEditingPerson}
              onDeletePerson={handleDeletePerson}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPersonModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
        existingOrgs={organizations}
      />
      
      {editingPerson && (
        <EditPersonModal
          isOpen={!!editingPerson}
          onClose={() => setEditingPerson(null)}
          onSuccess={handleEditSuccess}
          person={editingPerson}
          existingOrgs={organizations}
        />
      )}

      <AddInteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['interactions'] });
        }}
        people={people}
        events={events}
      />
    </div>
  );
}

