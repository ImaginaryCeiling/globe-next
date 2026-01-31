'use client';

export default function SplashScreen() {
  return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      {/* Background gradients matching landing page */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />
      
      {/* Logo and loading animation */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Pulsing glow behind logo */}
        <div className="absolute w-32 h-32 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
        
        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
          <span className="text-4xl font-bold text-white tracking-tight">Globe</span>
        </div>
        
        {/* Loading dots */}
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 bg-amber-500/60 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }} 
          />
          <div 
            className="w-2 h-2 bg-amber-500/60 rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }} 
          />
          <div 
            className="w-2 h-2 bg-amber-500/60 rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }} 
          />
        </div>
      </div>
    </div>
  );
}
