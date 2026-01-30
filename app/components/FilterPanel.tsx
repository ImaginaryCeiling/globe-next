'use client';

import { useState } from 'react';
import type { Organization } from '../types/schema';

interface FilterPanelProps {
  organizations: Organization[];
  selectedOrgIds: string[];
  onOrgFilterChange: (orgIds: string[]) => void;
  dateFilter: { start?: string; end?: string };
  onDateFilterChange: (filter: { start?: string; end?: string }) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function FilterPanel({
  organizations,
  selectedOrgIds,
  onOrgFilterChange,
  dateFilter,
  onDateFilterChange,
  onClearFilters,
  hasActiveFilters,
}: FilterPanelProps) {
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  const toggleOrg = (orgId: string) => {
    if (selectedOrgIds.includes(orgId)) {
      onOrgFilterChange(selectedOrgIds.filter(id => id !== orgId));
    } else {
      onOrgFilterChange([...selectedOrgIds, orgId]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-4">
      {/* Organization Filter */}
      <div className="relative">
        <button
          onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-blue-500/50 transition-colors text-sm"
        >
          <span>Organization</span>
          {selectedOrgIds.length > 0 && (
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedOrgIds.length}
            </span>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${isOrgDropdownOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {isOrgDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOrgDropdownOpen(false)}
            />
            <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
              {organizations.length === 0 ? (
                <div className="p-4 text-zinc-500 text-sm">No organizations</div>
              ) : (
                <div className="p-2">
                  {organizations.map((org) => {
                    const isSelected = selectedOrgIds.includes(org.id);
                    return (
                      <label
                        key={org.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOrg(org.id)}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-900"
                        />
                        <span className="text-zinc-300 text-sm">{org.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="date"
          value={dateFilter.start || ''}
          onChange={(e) => onDateFilterChange({ ...dateFilter, start: e.target.value })}
          placeholder="Start date"
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
        />
        <span className="text-zinc-500 text-sm">to</span>
        <input
          type="date"
          value={dateFilter.end || ''}
          onChange={(e) => onDateFilterChange({ ...dateFilter, end: e.target.value })}
          placeholder="End date"
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors text-sm"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

