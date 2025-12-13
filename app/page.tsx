'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Person, Event, Organization } from './types/schema';
import SidePanel from './components/SidePanel';
import Navigation from './components/Navigation';
import AddPersonModal from './components/AddPersonModal';
import EditPersonModal from './components/EditPersonModal';

// Dynamically import Map component (client-side only)
const Map = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
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

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [peopleRes, eventsRes, orgsRes] = await Promise.all([
          fetch('/api/people'),
          fetch('/api/events'),
          fetch('/api/organizations')
        ]);

        if (peopleRes.ok) setPeople(await peopleRes.json());
        if (eventsRes.ok) setEvents(await eventsRes.json());
        if (orgsRes.ok) setOrganizations(await orgsRes.json());

      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    fetchData();
  }, []);

  const handlePersonClick = (person: Person) => {
    console.log('Clicked person:', person);
    // Could open side panel detail view or similar
  };

  const handleAddSuccess = (newPerson: Person) => {
    setPeople(prev => [newPerson, ...prev]);
  };

  const handleEditSuccess = (updatedPerson: Person) => {
    setPeople(prev => prev.map(p => p.id === updatedPerson.id ? updatedPerson : p));
  };

  const handleDeletePerson = async (id: string) => {
    try {
       const res = await fetch(`/api/people/${id}`, { method: 'DELETE' });
       if (!res.ok) throw new Error('Failed to delete');
       
       setPeople(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete person');
    }
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      {/* Left Navigation */}
      <Navigation isOpen={isNavOpen} onToggle={() => setIsNavOpen(!isNavOpen)} />

      
      {/* Main Content Area */}
      <div className={`flex-1 relative h-full transition-all duration-300 ${isNavOpen ? 'ml-64' : 'ml-16'}`}>
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
