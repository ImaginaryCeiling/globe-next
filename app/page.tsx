'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Profile } from './types/profile';
import SidePanel from './components/SidePanel';

// Dynamically import Map component (client-side only)
const Map = dynamic(() => import('./components/Map'), { ssr: false });

export default function Home() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([]);

  // Load profiles from JSON
  useEffect(() => {
    fetch('/data/profiles.json')
      .then((res) => res.json())
      .then((data) => {
        console.log('Loaded profiles:', data);
        setProfiles(data);
      })
      .catch((err) => console.error('Error loading profiles:', err));
  }, []);

  const handleCellClick = (cellProfiles: Profile[]) => {
    console.log('handleCellClick called with:', cellProfiles);
    setSelectedProfiles(cellProfiles);
  };

  const handleClosePanel = () => {
    setSelectedProfiles([]);
  };

  console.log('Rendering Home - selectedProfiles:', selectedProfiles);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <Map profiles={profiles} onCellClick={handleCellClick} />
      <SidePanel profiles={selectedProfiles} onClose={handleClosePanel} />
    </div>
  );
}
