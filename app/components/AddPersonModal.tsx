'use client';

import { useState, useEffect } from 'react';
import type { Organization, Person } from '../types/schema';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (person: Person) => void;
}

export default function AddPersonModal({ isOpen, onClose, onSuccess }: AddPersonModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingOrgs, setExistingOrgs] = useState<Organization[]>([]);
  
  // Form State
  const [orgName, setOrgName] = useState('');
  const [isNewOrg, setIsNewOrg] = useState(false);
  // Now supports multiple selected IDs
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  
  const [personData, setPersonData] = useState({
    name: '',
    phone: '',
    email: '',
    linkedin: '',
    lat: '',
    lng: '',
    notes: ''
  });

  // Load organizations on open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/organizations')
        .then(res => res.json())
        .then(data => setExistingOrgs(data))
        .catch(err => console.error('Failed to load orgs', err));
    }
  }, [isOpen]);

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
        current_location_lat: parseFloat(personData.lat),
        current_location_lng: parseFloat(personData.lng),
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
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">
            {step === 1 ? 'Step 1: Organizations' : 'Step 2: Person Details'}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
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
                         className="accent-red-600"
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
                      className="accent-red-600"
                    />
                    <label htmlFor="newOrgCheck" className="text-zinc-300 text-sm cursor-pointer">Create new organization</label>
                  </div>

                  {isNewOrg && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
                        placeholder="New Org Name"
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                      />
                      <button 
                        type="submit"
                        disabled={!orgName || isSubmitting}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-3 rounded disabled:opacity-50"
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
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
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
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
                value={personData.name}
                onChange={e => setPersonData({...personData, name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Latitude (Current)</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
                  value={personData.lat}
                  onChange={e => setPersonData({...personData, lat: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1">Longitude (Current)</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none"
                  value={personData.lng}
                  onChange={e => setPersonData({...personData, lng: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-1">Notes</label>
              <textarea
                className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white focus:border-red-500 outline-none h-24"
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
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
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
