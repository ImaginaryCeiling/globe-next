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
  const [isNavOpen, setIsNavOpen] = useState(true);

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

      {/* Expand Nav Button */}
      {!isNavOpen && (
        <button 
          onClick={() => setIsNavOpen(true)}
          className="fixed left-4 top-4 z-50 bg-black/90 backdrop-blur-sm border border-zinc-800 text-white p-3 rounded-lg hover:bg-zinc-900 transition-all shadow-xl"
          aria-label="Open navigation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      )}
      
      {/* Main Content Area */}
      <div className={`flex-1 relative h-full transition-all duration-300 ${isNavOpen ? 'ml-64' : 'ml-0'}`}>
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
