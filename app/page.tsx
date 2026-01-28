'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Animated connection node
interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

function ConnectionsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize nodes
    const nodeCount = 60;
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const mouse = mouseRef.current;

      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Move
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off walls
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.fill();

        // Connect to nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            const opacity = (1 - dist / 150) * 0.15;
            ctx.strokeStyle = `rgba(251, 191, 36, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Connect to mouse
        const mouseDx = node.x - mouse.x;
        const mouseDy = node.y - mouse.y;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);

        if (mouseDist < 200) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mouse.x, mouse.y);
          const opacity = (1 - mouseDist / 200) * 0.4;
          ctx.strokeStyle = `rgba(251, 191, 36, ${opacity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.7 }}
    />
  );
}

// Feature card component
function FeatureCard({ 
  icon, 
  title, 
  description,
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: number;
}) {
  return (
    <div 
      className="group relative bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 hover:border-amber-500/30 transition-all duration-500 hover:bg-zinc-900/60"
      style={{ 
        animationDelay: `${delay}ms`,
        animation: 'fadeSlideUp 0.8s ease-out backwards'
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mb-4 group-hover:from-amber-500/30 group-hover:to-orange-600/30 transition-all duration-500">
        <div className="text-amber-400">{icon}</div>
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  // WORKAROUND: ESLint rule disabled for hydration detection pattern
  // This is a standard pattern to detect client-side mounting for animations.
  // The lint rule warns against setState in effects, but this is intentional
  // for SSR hydration. Alternative: use `useSyncExternalStore` with a
  // subscription that always returns `true` on client.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-950 to-black" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-orange-900/5 via-transparent to-transparent" />
      
      {/* Animated connections */}
      <ConnectionsCanvas />

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-xl font-bold tracking-tight">Globe</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard"
                className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard"
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-lg transition-all duration-300 text-sm hover:shadow-lg hover:shadow-amber-500/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-20">
          <div className="max-w-5xl mx-auto text-center">
            <div 
              className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <div className="inline-flex items-center gap-2 bg-zinc-900/60 backdrop-blur-sm border border-zinc-800 rounded-full px-4 py-2 mb-8">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-zinc-400 text-sm">Your personal relationship memory</span>
              </div>
            </div>

            <h1 
              className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 transition-all duration-1000 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Remember every
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                connection
              </span>
            </h1>

            <p 
              className={`text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              A beautiful CRM for humans. Map your relationships, track meaningful interactions, 
              and never forget the people who matter.
            </p>

            <div 
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-450 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <Link
                href="/dashboard"
                className="group relative bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Open Dashboard
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/crm"
                className="text-zinc-400 hover:text-white font-medium px-8 py-4 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:bg-zinc-900/50"
              >
                View CRM Table
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Built for meaningful relationships
                </span>
              </h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                Everything you need to nurture your professional and personal network.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                delay={0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                }
                title="Visual Map"
                description="See your entire network on an interactive map. Discover geographic patterns and plan visits."
              />
              <FeatureCard
                delay={100}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                }
                title="People & Organizations"
                description="Track individuals and companies together. Connect people to orgs and see the full picture."
              />
              <FeatureCard
                delay={200}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
                title="Interaction History"
                description="Log meetings, calls, and notes. Never forget what you discussed or when you last connected."
              />
              <FeatureCard
                delay={300}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                }
                title="Events & Meetings"
                description="Track shared events and conferences. Remember who you met and where."
              />
              <FeatureCard
                delay={400}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                }
                title="Smart Search"
                description="Find anyone instantly. Search by name, company, location, or notes."
              />
              <FeatureCard
                delay={500}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                }
                title="Private & Secure"
                description="Your data stays yours. Self-hosted on your own Supabase instance."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 blur-3xl rounded-full" />
              
              <div className="relative bg-zinc-900/40 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-12 sm:p-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                    Start building your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    relationship memory
                  </span>
                </h2>
                <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
                  Your network is your net worth. Start mapping the connections that matter.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/30 hover:scale-105"
                >
                  Launch Globe
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

          {/* Footer */}
        <footer className="py-8 px-6 border-t border-zinc-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              <span className="text-zinc-500 text-sm">Globe</span>
            </div>
            <p className="text-zinc-600 text-sm">
              Your personal relationship memory system
            </p>
          </div>
        </footer>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
