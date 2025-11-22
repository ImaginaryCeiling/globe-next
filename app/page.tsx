'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Profile } from './types/profile';
import SidePanel from './components/SidePanel';
import Navigation from './components/Navigation';
import AddPersonModal from './components/AddPersonModal';

// Dynamically import Map component (client-side only)
const Map = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load profiles from API
  useEffect(() => {
    fetch('/api/profiles')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          console.log('Loaded profiles:', data);
          setProfiles(data);
        } else {
          console.error('Invalid profiles data:', data);
        }
      })
      .catch((err) => console.error('Error loading profiles:', err));
  }, []);

  const handleCellClick = (cellProfiles: Profile[]) => {
    console.log('handleCellClick called with:', cellProfiles);
  };

  const handleAddSuccess = (newProfile: Profile) => {
    setProfiles(prev => [...prev, newProfile]);
  };

  return (
    <div className="w-full h-screen bg-black overflow-hidden flex">
      {/* Left Navigation */}
      <Navigation />
      
      {/* Main Content Area */}
      <div className="flex-1 relative h-full ml-64">
        <Map profiles={profiles} onCellClick={handleCellClick} />
        
        <SidePanel 
          profiles={profiles} 
          onAddClick={() => setIsModalOpen(true)}
        />
      </div>

      <AddPersonModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
