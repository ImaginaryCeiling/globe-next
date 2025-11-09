'use client';

import type { Profile } from '../types/profile';

interface SidePanelProps {
  profiles: Profile[];
  onClose: () => void;
}

export default function SidePanel({ profiles, onClose }: SidePanelProps) {
  console.log('SidePanel rendering with profiles:', profiles, 'length:', profiles.length);

  if (profiles.length === 0) {
    console.log('SidePanel returning null - no profiles');
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-black border-l border-red-500/30 z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-black border-b border-red-500/30 p-4 flex justify-between items-center">
          <h2 className="text-white text-lg font-semibold">
            {profiles.length} {profiles.length === 1 ? 'Profile' : 'Profiles'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-500 transition-colors text-2xl font-light"
          >
            ×
          </button>
        </div>

        {/* Profile List */}
        <div className="p-4 space-y-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-colors p-4 rounded-lg"
            >
              {/* Name */}
              <h3 className="text-white text-xl font-semibold mb-2">
                {profile.name}
              </h3>

              {/* Met At */}
              <div className="mb-2">
                <span className="text-yellow-500 text-sm font-medium">Met at:</span>
                <p className="text-white">{profile.met_at}</p>
              </div>

              {/* Met On */}
              <div className="mb-2">
                <span className="text-green-500 text-sm font-medium">Date:</span>
                <p className="text-white">{profile.met_on}</p>
              </div>

              {/* Notes */}
              {profile.notes && (
                <div className="mb-2">
                  <span className="text-orange-500 text-sm font-medium">Notes:</span>
                  <p className="text-white">{profile.notes}</p>
                </div>
              )}

              {/* Tags */}
              {profile.tags && profile.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Location coordinates (small text at bottom) */}
              <div className="mt-3 pt-2 border-t border-zinc-800">
                <span className="text-zinc-500 text-xs">
                  {profile.location[0].toFixed(4)}, {profile.location[1].toFixed(4)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
