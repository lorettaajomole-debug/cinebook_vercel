"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Film, Lock, Mail, Shield, User, AlertCircle, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed");
        setIsLoading(false);
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: presetEmail, password: presetPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed");
        setIsLoading(false);
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan to-blue-600 shadow-glow-cyan">
          <Film className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Sign In to CineBook</h1>
        <p className="text-xs text-gray-400">
          Access your digital passes, manage reservations, and book seats.
        </p>
      </div>

      {/* 1-Click Quick Preset Buttons */}
      <div className="rounded-2xl bg-surface-raised border border-surface-border p-4 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-cyan flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Quick Demo Sign-In (1-Click)
        </span>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleQuickLogin("demo@cinebook.com", "User123!")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface border border-surface-border text-xs font-semibold text-gray-200 hover:border-accent-cyan hover:text-white transition-all cursor-pointer"
          >
            <User className="h-3.5 w-3.5 text-accent-cyan" />
            Demo User
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin("admin@cinebook.com", "Admin123!")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface border border-surface-border text-xs font-semibold text-gray-200 hover:border-accent-gold hover:text-white transition-all cursor-pointer"
          >
            <Shield className="h-3.5 w-3.5 text-accent-gold" />
            Administrator
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-800 p-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl bg-surface border border-surface-border p-6 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl bg-surface-raised border border-surface-border pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl bg-surface-raised border border-surface-border pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:border-accent-cyan focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-blue-600 py-3 text-xs font-bold text-gray-950 shadow-glow-cyan hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>

        <p className="text-center text-xs text-gray-400 pt-2">
          Don't have an account?{" "}
          <Link href={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="text-accent-cyan font-semibold hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-gray-400">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
