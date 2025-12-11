'use client';

interface NavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function Navigation({ isOpen, onToggle }: NavigationProps) {
  const navItems = [
    { name: 'Map', active: true },
    { name: 'CRM', active: false },
    { name: 'Companies', active: false },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-black/90 backdrop-blur-sm border-r border-zinc-800 flex flex-col z-50 pointer-events-auto transition-transform duration-300">
      {/* Logo/Header */}
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
          Globe
        </h1>
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

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              item.active
                ? 'bg-zinc-900 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
            }`}
          >
            {item.name}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
             <span className="text-zinc-400 font-bold">U</span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">User</p>
            <p className="text-zinc-500 text-xs">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}


