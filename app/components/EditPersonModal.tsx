'use client';

import { useState, useEffect, useRef } from 'react';
import type { Organization, Person } from '../types/schema';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (person: Person) => void;
  person: Person;
  existingOrgs: Organization[];
}

export default function EditPersonModal({ isOpen, onClose, onSuccess, person, existingOrgs: initialOrgs }: EditPersonModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  
  useEffect(() => {
    setExistingOrgs(initialOrgs);
  }, [initialOrgs]);

  // Pre-fill logic
  useEffect(() => {
    if (isOpen && person) {
      setPersonData({
        name: person.name,
        phone: person.contact_info?.phone || '',
        email: person.contact_info?.email || '',
        linkedin: person.contact_info?.linkedin || '',
        lat: person.current_location_lat.toString(),
        lng: person.current_location_lng.toString(),
        notes: person.notes || ''
      });
      setLocationQuery(person.location_name || '');
      setLocationAddress(person.location_address || '');
      setSelectedOrgIds(person.organizations?.map(o => o.id) || []);
    }
  }, [isOpen, person]);

  // Form State
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

  // Initialize Google Places Autocomplete
  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | null = null;

    if (isOpen && locationInputRef.current && (window as { google?: typeof google }).google) {
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
  }, [isOpen]);

  if (!isOpen) return null;

  // NOTE: Inline organization creation was removed during lint fixes.
  // If you need to add new organizations while editing a person, you'll
  // need to re-implement handleOrgCreation() with associated UI (checkbox
  // for "Create new org" + text input). See AddPersonModal for reference.

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

    const lat = personData.lat;
    const lng = personData.lng;

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
        organization_ids: selectedOrgIds,
        current_location_lat: parseFloat(lat),
        current_location_lng: parseFloat(lng),
        location_name: locationQuery,
        location_address: locationAddress,
        notes: personData.notes
      };

      const res = await fetch(`/api/people/${person.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed');
      
      const updatedPerson = await res.json();
      
      // Manually attach orgs for UI update
      const orgs = existingOrgs.filter(o => selectedOrgIds.includes(o.id));
      updatedPerson.organizations = orgs;

      onSuccess(updatedPerson);
      onClose();

    } catch (error) {
      console.error(error);
      alert('Failed to update person');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-lg w-full md:max-w-md p-6 h-[92vh] md:h-auto md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">Edit Person</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 -mr-2">✕</button>
        </div>

        <form onSubmit={handlePersonSubmit} className="space-y-6">
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
                  setPersonData(prev => ({ ...prev, lat: '', lng: '' }));
                  setLocationAddress(''); 
              }}
            />
          </div>

          {/* Organizations Selection in Edit Mode (Simplified) */}
          <div>
             <label className="block text-zinc-400 text-sm mb-2">Organizations</label>
             <div className="max-h-32 overflow-y-auto border border-zinc-700 rounded p-2 space-y-2 mb-2">
               {existingOrgs.map(org => (
                 <div key={org.id} className="flex items-center gap-2 hover:bg-zinc-800 p-1 rounded">
                   <input 
                     type="checkbox"
                     id={`edit-org-${org.id}`}
                     checked={selectedOrgIds.includes(org.id)}
                     onChange={() => toggleOrgSelection(org.id)}
                     className="accent-blue-600"
                   />
                   <label htmlFor={`edit-org-${org.id}`} className="text-zinc-300 text-sm flex-1 cursor-pointer select-none">
                     {org.name}
                   </label>
                 </div>
               ))}
             </div>
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
              onClick={onClose}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 px-4 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

