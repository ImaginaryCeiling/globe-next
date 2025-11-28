'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Person, Event, Organization } from './types/schema';
import SidePanel from './components/SidePanel';
import Navigation from './components/Navigation';
import AddPersonModal from './components/AddPersonModal';

// Dynamically import Map component (client-side only)
const Map = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      {/* Left Navigation */}
      <Navigation />
      
      {/* Main Content Area */}
      <div className="flex-1 relative h-full ml-64">
        <Map people={people} onPersonClick={handlePersonClick} />
        
        <SidePanel 
          people={people}
          events={events}
          organizations={organizations} 
          onAddClick={() => setIsModalOpen(true)}
        />
      </div>

      <AddPersonModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
        existingOrgs={organizations}
      />
    </div>
  );
}
