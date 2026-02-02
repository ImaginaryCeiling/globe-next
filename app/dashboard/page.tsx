'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Person, Event } from '../types/schema';
import SidePanel from '../components/SidePanel';
import Navigation from '../components/Navigation';
import AddPersonModal from '../components/AddPersonModal';
import EditPersonModal from '../components/EditPersonModal';
import AddEventModal from '../components/AddEventModal';
import AddInteractionModal from '../components/AddInteractionModal';
import { usePeople } from '../hooks/usePeople';
import { useEvents } from '../hooks/useEvents';
import { useOrganizations } from '../hooks/useOrganizations';
import { useInteractions } from '../hooks/useInteractions';
import { useQueryClient } from '@tanstack/react-query';
import SplashScreen from '../components/SplashScreen';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: organizations = [], isLoading: orgsLoading } = useOrganizations();
  const { data: interactions = [], isLoading: interactionsLoading } = useInteractions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [interactionModal, setInteractionModal] = useState<{ open: boolean; eventContext?: Event | null }>({ open: false });
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

  const handlePersonClick = (person: Person) => {
    console.log('Clicked person:', person);
  };

  const handleAddSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  const handleDeletePerson = async (id: string) => {
    try {
      const res = await fetch(`/api/people/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['interactions'] });
    } catch (err) {
      console.error(err);
      alert('Failed to delete person');
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] });
    queryClient.invalidateQueries({ queryKey: ['interactions'] });
  };

  if (peopleLoading || eventsLoading || orgsLoading || interactionsLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      <Navigation isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />

      <div className={`flex-1 relative h-full transition-all duration-300 ${isNavOpen ? 'md:ml-64' : 'md:ml-16'} pb-16 md:pb-0`}>
        <Map people={people} onPersonClick={handlePersonClick} />

        <SidePanel
          people={people}
          events={events}
          organizations={organizations}
          interactions={interactions}
          onAddClick={() => setIsModalOpen(true)}
          onAddEventClick={() => setIsAddEventOpen(true)}
          onAddInteractionClick={(eventContext) => setInteractionModal({ open: true, eventContext })}
          onEditEvent={(event) => setEditingEvent(event)}
          onDeleteEvent={() => invalidate()}
          onEditPerson={(person) => setEditingPerson(person)}
          onDeletePerson={handleDeletePerson}
          onInteractionsChange={invalidate}
        />
      </div>

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

      <AddEventModal
        isOpen={isAddEventOpen || !!editingEvent}
        onClose={() => { setIsAddEventOpen(false); setEditingEvent(null); }}
        onSuccess={() => invalidate()}
        editingEvent={editingEvent}
      />

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
