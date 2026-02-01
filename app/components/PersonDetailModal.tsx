'use client';

import type { Person } from '../types/schema';

interface PersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onEdit: (person: Person) => void;
}

export default function PersonDetailModal({ isOpen, onClose, person, onEdit }: PersonDetailModalProps) {
  if (!isOpen || !person) return null;

  const handleEdit = () => {
    onClose();
    onEdit(person);
  };

  const contactFields = [
    { key: 'phone', label: 'Phone', icon: PhoneIcon, href: (v: string) => `tel:${v}` },
    { key: 'email', label: 'Email', icon: EmailIcon, href: (v: string) => `mailto:${v}` },
    { key: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon, href: (v: string) => v.startsWith('http') ? v : `https://linkedin.com/in/${v}` },
    { key: 'instagram', label: 'Instagram', icon: InstagramIcon, href: (v: string) => v.startsWith('http') ? v : `https://instagram.com/${v}` },
    { key: 'twitter', label: 'Twitter', icon: TwitterIcon, href: (v: string) => v.startsWith('http') ? v : `https://twitter.com/${v}` },
  ];

  const hasContactInfo = contactFields.some(f => person.contact_info?.[f.key]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm md:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-t-2xl md:rounded-lg w-full md:max-w-lg p-6 h-[85vh] md:h-auto md:max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-white text-2xl font-bold">{person.name}</h2>
            {person.organizations && person.organizations.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {person.organizations.map((org, idx) => (
                  <span 
                    key={idx} 
                    className="text-blue-400 text-xs uppercase tracking-wide bg-blue-900/30 px-2 py-1 rounded"
                  >
                    {org.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded transition-colors"
              title="Edit"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button 
              onClick={onClose} 
              className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contact Info */}
        {hasContactInfo && (
          <div className="mb-6">
            <h3 className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Contact</h3>
            <div className="space-y-2">
              {contactFields.map(({ key, label, icon: Icon, href }) => {
                const value = person.contact_info?.[key];
                if (!value) return null;
                return (
                  <a
                    key={key}
                    href={href(value)}
                    target={key !== 'phone' && key !== 'email' ? '_blank' : undefined}
                    rel={key !== 'phone' && key !== 'email' ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 text-zinc-300 hover:text-white transition-colors group"
                  >
                    <Icon className="w-5 h-5 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                    <span className="text-sm">{value}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Location */}
        <div className="mb-6">
          <h3 className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Location</h3>
          <div className="flex items-start gap-3">
            <LocationIcon className="w-5 h-5 text-zinc-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-zinc-300 text-sm">
                {person.location_name || `${person.current_location_lat.toFixed(4)}, ${person.current_location_lng.toFixed(4)}`}
              </p>
              {person.location_address && person.location_address !== person.location_name && (
                <p className="text-zinc-500 text-xs mt-1">{person.location_address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {person.notes && (
          <div className="mb-6">
            <h3 className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Notes</h3>
            <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{person.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
          {person.created_at && (
            <p className="text-zinc-600 text-xs">
              Added {new Date(person.created_at).toLocaleDateString()}
            </p>
          )}
          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded transition-colors"
          >
            Edit Person
          </button>
        </div>
      </div>
    </div>
  );
}

// Icon Components
function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
