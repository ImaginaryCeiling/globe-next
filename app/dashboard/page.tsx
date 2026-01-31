'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Person } from '../types/schema';
import SidePanel from '../components/SidePanel';
import Navigation from '../components/Navigation';
import AddPersonModal from '../components/AddPersonModal';
import EditPersonModal from '../components/EditPersonModal';
import { usePeople } from '../hooks/usePeople';
import { useEvents } from '../hooks/useEvents';
import { useOrganizations } from '../hooks/useOrganizations';
import { useQueryClient } from '@tanstack/react-query';
import SplashScreen from '../components/SplashScreen';

// Dynamically import Map component (client-side only)
const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function DashboardPage() {
  const queryClient = useQueryClient();
  
  // Use TanStack Query hooks - data is now cached!
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: organizations = [], isLoading: orgsLoading } = useOrganizations();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
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

  const handlePersonClick = (person: Person) => {
    console.log('Clicked person:', person);
    // Could open side panel detail view or similar
  };

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
       
       // Invalidate and refetch people data
       queryClient.invalidateQueries({ queryKey: ['people'] });
    } catch (err) {
      console.error(err);
      alert('Failed to delete person');
    }
  };

  // Show loading state if any data is loading
  if (peopleLoading || eventsLoading || orgsLoading) {
    return <SplashScreen />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      {/* Left Navigation */}
      <Navigation isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />

      
      {/* Main Content Area */}
      <div className={`flex-1 relative h-full transition-all duration-300 ${isNavOpen ? 'md:ml-64' : 'md:ml-16'} pb-16 md:pb-0`}>
        <Map people={people} onPersonClick={handlePersonClick} />
        
        <SidePanel 
          people={people}
          events={events}
          organizations={organizations} 
          onAddClick={() => setIsModalOpen(true)}
          onEditPerson={(person) => setEditingPerson(person)}
          onDeletePerson={handleDeletePerson}
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
    </div>
  );
}
