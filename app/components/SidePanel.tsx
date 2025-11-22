'use client';

import type { Profile } from '../types/profile';

interface SidePanelProps {
  profiles: Profile[];
  onClose?: () => void;
  onAddClick: () => void;
}

export default function SidePanel({ profiles, onClose, onAddClick }: SidePanelProps) {
  return (
    <div className="fixed right-4 top-4 bottom-4 w-full sm:w-96 bg-black/90 backdrop-blur-sm border border-red-500/30 rounded-lg z-50 overflow-hidden flex flex-col shadow-2xl pointer-events-auto">
      {/* Header */}
      <div className="bg-black border-b border-red-500/30 p-4 flex justify-between items-center shrink-0">
        <h2 className="text-white text-lg font-semibold">
          {profiles.length} {profiles.length === 1 ? 'Profile' : 'Profiles'}
        </h2>
        <button 
          onClick={onAddClick}
          className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Profile List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {profiles.length === 0 ? (
          <div className="text-zinc-500 text-center mt-10">
            No profiles found. Add one!
          </div>
        ) : (
          profiles.map((profile) => (
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
                <span className="text-yellow-500 text-sm font-medium">Met at: </span>
                <p className="text-white">{profile.met_at}</p>
              </div>

              {/* Met On */}
              <div className="mb-2">
                <span className="text-green-500 text-sm font-medium">Date: </span>
                <p className="text-white">{profile.met_on}</p>
              </div>

              {/* Notes */}
              {profile.notes && (
                <div className="mb-2">
                  <span className="text-orange-500 text-sm font-medium">Notes: </span>
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
          ))
        )}
      </div>
    </div>
  );
}
