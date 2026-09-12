import Link from "next/link";
import { Film, Sparkles, Shield, Heart, HelpCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/60 mt-20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan to-blue-600 shadow-glow-cyan">
                <Film className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                Cine<span className="text-accent-cyan">Book</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Experience the pinnacle of modern cinema. Reserve premium IMAX, Dolby Atmos, and VIP Recliner seats with instant confirmation.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational on Vercel
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">Explore</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link href="/movies" className="hover:text-accent-cyan transition-colors">
                  Now Showing Movies
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-accent-cyan transition-colors">
                  Cinemas & IMAX Screens
                </Link>
              </li>
              <li>
                <Link href="/profile/bookings" className="hover:text-accent-cyan transition-colors">
                  Ticket Verification & History
                </Link>
              </li>
            </ul>
          </div>

          {/* Experiences & Formats */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">Cinema Formats</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-accent-gold" /> IMAX Laser 70mm
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-accent-cyan" /> Dolby Atmos 64-Channel
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-accent-ruby" /> VIP Luxe Recliner Suites
              </li>
            </ul>
          </div>

          {/* Technology & Compliance */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-3">Platform Specs</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>Next.js 15 App Router & Vercel Functions</li>
              <li>Neon Serverless PostgreSQL with Drizzle ORM</li>
              <li>Atomic Row Locks & Concurrency Safeguard</li>
              <li>Zero Secret Leaks in Browser Code</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-surface-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} CineBook Inc. Ready for Vercel deployment.</p>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Security Verified</span>
            <span>•</span>
            <span className="text-gray-400">Test Payment Mode Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
