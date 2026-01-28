'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';

interface NavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Navigation({ isOpen, onToggle }: NavigationProps) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const { user, signOut } = useAuth();
  
  const navItems = [
    { 
      name: 'Map', 
      href: '/dashboard', 
      active: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      )
    },
    { 
      name: 'CRM', 
      href: '/crm', 
      active: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      )
    },
  ];

  const isMinimized = !isOpen;
  const isExpanded = isOpen || isHovered;
  const width = isExpanded ? 'w-64' : 'w-16';

  return (
    <div 
      className={`fixed left-0 top-0 h-full ${width} bg-black/90 backdrop-blur-sm border-r border-zinc-800 flex flex-col z-50 pointer-events-auto transition-all duration-300`}
      onMouseEnter={() => isMinimized && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo/Header - Only show when expanded */}
      {isExpanded && (
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
          <Link href="/" className="text-white text-2xl font-bold flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="w-3 h-3 bg-amber-500 rounded-full inline-block"></span>
            Globe
          </Link>
          <button 
            onClick={onToggle}
            className="text-zinc-500 hover:text-white transition-colors"
            aria-label="Close navigation"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </button>
        </div>
      )}

      {/* Nav Items - Stacked vertically */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.filter(item => item.active).map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard');
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                // On mobile, close sidebar after navigation
                if (window.innerWidth < 768) {
                  onToggle();
                }
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-white bg-zinc-900/50 border border-blue-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              } ${isExpanded ? 'justify-start' : 'justify-center'}`}
              title={isMinimized ? item.name : undefined}
            >
              <span className={`shrink-0 ${isActive ? 'text-blue-400' : ''}`}>
                {item.icon}
              </span>
              {isExpanded && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={`p-4 border-t border-zinc-800 shrink-0 ${isExpanded ? '' : 'flex flex-col items-center gap-2'}`}>
        {isExpanded ? (
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition-colors">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden shrink-0">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-zinc-400 font-bold">
                  {user?.email?.[0].toUpperCase() ?? 'U'}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">
                {user?.user_metadata?.full_name ?? 'User'}
              </p>
              <p className="text-zinc-500 text-xs truncate">{user?.email ?? 'user@example.com'}</p>
            </div>
            <button
              onClick={signOut}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              title="Sign out"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={signOut}
            className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:border-zinc-600 transition-colors overflow-hidden"
            title="Sign out"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-zinc-400 font-bold text-sm">
                {user?.email?.[0].toUpperCase() ?? 'U'}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}


