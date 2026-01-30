'use client';

import { useState, useEffect, useRef } from 'react';
import type { Organization, Person } from '../types/schema';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (person: Person) => void;
  existingOrgs: Organization[];
}

export default function AddPersonModal({ isOpen, onClose, onSuccess, existingOrgs: initialOrgs }: AddPersonModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  
  useEffect(() => {
    setExistingOrgs(initialOrgs);
  }, [initialOrgs]);

  // Form State
  const [orgName, setOrgName] = useState('');
  const [isNewOrg, setIsNewOrg] = useState(false);
  // Now supports multiple selected IDs
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  
  const [locationQuery, setLocationQuery] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const locationInputRef = useRef<HTMLInputElement>(null);
  
  const [personData, setPersonData] = useState({
    name: '',
    phone: '',
    email: '',
    linkedin: '',
    lat: '',
    lng: '',
    notes: ''
  });

  // Load organizations on open -> Removed internal fetch
  // We now receive orgs from props, but we keep local state to add new ones optimistically
  
  // Initialize Google Places Autocomplete
  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | null = null;

    if (step === 2 && locationInputRef.current && (window as { google?: typeof google }).google) {
      // Load the places library if not already loaded
      // We are using the main script loader, but we need to ensure 'places' lib is accessible
      // The script tag includes libraries=places so google.maps.places should be available
      
      const initAutocomplete = async () => {
        try {
            const { Autocomplete } = await (window as { google: typeof google }).google.maps.importLibrary("places") as google.maps.PlacesLibrary;
            
            // WORKAROUND: Non-null assertions (!) used for Google Maps API
            // locationInputRef.current is guaranteed non-null by the outer if-check,
            // but TypeScript can't infer this. If Google Maps API changes or the
            // ref becomes null unexpectedly, these will throw. The outer condition
            // `locationInputRef.current && window.google` should prevent this.
            autocomplete = new Autocomplete(locationInputRef.current!, {
                fields: ["geometry", "formatted_address", "name"],
                types: ['geocode', 'establishment']
            });

            autocomplete.addListener("place_changed", () => {
                // Non-null assertion: autocomplete exists because we're inside its listener
                const place = autocomplete!.getPlace();
                
                if (!place.geometry || !place.geometry.location) {
                    // User entered the name of a Place that was not suggested and
                    // pressed the Enter key, or the Place Details request failed.
                    return;
                }

                // WORKAROUND: Non-null assertions on geometry.location
                // The if-check above verifies these exist, but TypeScript loses
                // that context inside the callback. If place.geometry or location
                // is ever null despite the check, this will throw.
                setPersonData(prev => ({
                    ...prev,
                    lat: place.geometry!.location!.lat().toString(),
                    lng: place.geometry!.location!.lng().toString()
                }));
                
                // Prefer name for the display/query, save address separately
                const name = place.name || place.formatted_address || '';
                const address = place.formatted_address || '';
                
                setLocationQuery(name);
                setLocationAddress(address);
            });
        } catch (e) {
            console.error("Google Maps Places library load error", e);
        }
      };

      initAutocomplete();
    }

    return () => {
        if (autocomplete) {
            (window as { google: typeof google }).google.maps.event.clearInstanceListeners(autocomplete);
        }
    };
  }, [step, isOpen]);

  if (!isOpen) return null;

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If creating a new org, do it now
    if (isNewOrg && orgName) {
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/organizations', {
          method: 'POST',
          body: JSON.stringify({ name: orgName })
        });
        const newOrg = await res.json();
        
        // Add new org to list and select it
        setExistingOrgs([...existingOrgs, newOrg]);
        setSelectedOrgIds([...selectedOrgIds, newOrg.id]);
        
        // Reset creation input
        setOrgName('');
        setIsNewOrg(false);
      } catch (err) {
        console.error(err);
        alert('Failed to create organization');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Proceed to next step
      setStep(2);
    }
  };
  
  const toggleOrgSelection = (id: string) => {
    if (selectedOrgIds.includes(id)) {
      setSelectedOrgIds(selectedOrgIds.filter(oid => oid !== id));
    } else {
      setSelectedOrgIds([...selectedOrgIds, id]);
    }
  };

  const handlePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Geocode if we have a query but no coords (or if query changed - though simplified logic here)
    const lat = personData.lat;
    const lng = personData.lng;

    // Fallback manual validation if Google Autocomplete didn't catch it
    if (locationQuery && (!lat || !lng)) {
       alert('Please select a location from the dropdown suggestions.');
       setIsSubmitting(false);
       return;
    }

    try {
      const payload = {
        name: personData.name,
        contact_info: {
          phone: personData.phone,
          email: personData.email,
          linkedin: personData.linkedin
        },
        // Send array of org IDs
        organization_ids: selectedOrgIds,
        current_location_lat: parseFloat(lat),
        current_location_lng: parseFloat(lng),
        location_name: locationQuery,
        location_address: locationAddress,
        notes: personData.notes
      };

      const res = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed');
      
      const newPerson = await res.json();
      
      // Manually attach orgs for UI update
      const orgs = existingOrgs.filter(o => selectedOrgIds.includes(o.id));
      newPerson.organizations = orgs;

      onSuccess(newPerson);
      onClose();
      
      // Reset
      setStep(1);
      setPersonData({
        name: '',
        phone: '',
        email: '',
        linkedin: '',
        lat: '',
        lng: '',
        notes: ''
      });
      setLocationQuery('');
      setLocationAddress('');
      setOrgName('');
      setSelectedOrgIds([]);
      setIsNewOrg(false);

    } catch (error) {
      console.error(error);
      alert('Failed to create person');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-lg w-full md:max-w-md p-6 h-[92vh] md:h-auto md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">
            {step === 1 ? 'Step 1: Organizations' : 'Step 2: Person Details'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 -mr-2">✕</button>
        </div>

        {step === 1 ? (
          <form onSubmit={handleOrgSubmit} className="space-y-6">
            
            <div className="space-y-4">
               <p className="text-zinc-400 text-sm">Select organizations they belong to.</p>
               
               <div className="max-h-48 overflow-y-auto border border-zinc-700 rounded p-2 space-y-2">
                 {existingOrgs.length === 0 ? (
                   <p className="text-zinc-500 text-xs italic">No organizations found.</p>
                 ) : (
                   existingOrgs.map(org => (
                     <div key={org.id} className="flex items-center gap-2 hover:bg-zinc-800 p-1 rounded">
                       <input 
                         type="checkbox"
                         id={`org-${org.id}`}
                         checked={selectedOrgIds.includes(org.id)}
                         onChange={() => toggleOrgSelection(org.id)}
                         className="accent-blue-600"
                       />
                       <label htmlFor={`org-${org.id}`} className="text-zinc-300 text-sm flex-1 cursor-pointer select-none">
                         {org.name}
                       </label>
                     </div>
                   ))
                 )}
               </div>

               <div className="border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="newOrgCheck"
                      checked={isNewOrg} 
                      onChange={e => setIsNewOrg(e.target.checked)} 
                      className="accent-blue-600"
                    />
                    <label htmlFor="newOrgCheck" className="text-zinc-300 text-sm cursor-pointer">Create new organization</label>
                  </div>

                  {isNewOrg && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                        placeholder="New Org Name"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                      />
                      <button 
                        type="submit"
                        disabled={!orgName || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-3 rounded disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  )}
               </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 px-4 rounded transition-colors"
              >
                {selectedOrgIds.length > 0 ? 'Next' : 'Skip'}
              </button>
              
              {/* Only show explicit Next button if we aren't in "Add Mode" (which consumes the submit) */}
              {!isNewOrg && selectedOrgIds.length > 0 && (
                 <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                  Next
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handlePersonSubmit} className="space-y-4">
            <div>
              <label className="block text-zinc-400 text-sm mb-1">Name</label>
              <input
                type="text"
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={personData.name}
                onChange={e => setPersonData({...personData, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-1">Location</label>
              <input
                ref={locationInputRef}
                type="text"
                required
                placeholder="Search for a place..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none"
                value={locationQuery}
                onChange={e => {
                    setLocationQuery(e.target.value);
                    // Clear lat/lng when user types new location to force re-geocode
                    setPersonData(prev => ({ ...prev, lat: '', lng: '' }));
                    // We don't clear address immediately so we can keep the old one if they just edit the name, 
                    // but strictly speaking if they change the name, the address might be invalid. 
                    // For now, let's reset address if they type manually to ensure consistency.
                    setLocationAddress(''); 
                }}
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-1">Notes</label>
              <textarea
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-blue-500 outline-none h-24"
                value={personData.notes}
                onChange={e => setPersonData({...personData, notes: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 px-4 rounded transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Person'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
