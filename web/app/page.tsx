"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";

export default function Home() {
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState<string>("checking...");
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [lookupId, setLookupId] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status === "ok") {
          setHealthStatus("Connected ({ status: 'ok' })");
          setIsOnline(true);
        } else {
          setHealthStatus(`Unexpected status: ${JSON.stringify(data)}`);
          setIsOnline(false);
        }
      } catch (err: any) {
        setHealthStatus(`Disconnected: ${err.message}`);
        setIsOnline(false);
      }
    };

    checkHealth();
  }, []);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupId.trim();
    if (!trimmed) {
      setLookupError("Please enter an Idea ID");
      return;
    }
    setLookupError(null);
    router.push(`/ideas/${trimmed}`);
  };

  return (
    <div className="min-h-full py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      <main className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Embedra</h1>
            <p className="text-slate-400 text-sm mt-1">
              NLP-powered idea formation & collaboration platform
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Phase 1.1 Idea CRUD
          </span>
        </div>

        {/* Phase 1.1 Action Center */}
        <div className="p-6 bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Idea Formation CRUD</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Create new ideas, view formatted proposals, and manage domain categories.
              </p>
            </div>
            <Link
              href="/ideas/new"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/25 transition-all shrink-0"
            >
              + Create Idea
            </Link>
          </div>

          {/* Quick Idea Lookup */}
          <form onSubmit={handleLookup} className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="block text-xs font-medium text-slate-300">
              Lookup & View Idea by ID
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={lookupId}
                onChange={(e) => {
                  setLookupId(e.target.value);
                  if (lookupError) setLookupError(null);
                }}
                placeholder="Paste Idea UUID (e.g. 7f83a...)"
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                View
              </button>
            </div>
            {lookupError && (
              <p className="text-[11px] text-rose-400">{lookupError}</p>
            )}
          </form>
        </div>

        {/* Backend API Health Status (Phase 0) */}
        <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">Backend API Health Status</span>
            <div className="flex items-center space-x-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isOnline === true
                    ? "bg-emerald-500 animate-pulse"
                    : isOnline === false
                    ? "bg-rose-500"
                    : "bg-amber-500 animate-pulse"
                }`}
              />
              <span
                className={`text-xs font-mono font-medium ${
                  isOnline === true
                    ? "text-emerald-400"
                    : isOnline === false
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                {healthStatus}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Frontend endpoint request to <code className="text-slate-300 font-mono">{API_BASE}/health</code>
          </p>
        </div>

        {/* Phase 0 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800">
            <h3 className="font-semibold text-slate-200 mb-1">🔐 Auth Endpoints</h3>
            <p className="text-xs text-slate-400">
              JWT + bcrypt auth enabled on <code className="text-slate-300 font-mono">/auth/signup</code>, <code className="text-slate-300 font-mono">/auth/login</code>, and <code className="text-slate-300 font-mono">/auth/me</code>.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800">
            <h3 className="font-semibold text-slate-200 mb-1">🌱 Fixed Lookups</h3>
            <p className="text-xs text-slate-400">
              Starter rows for skills and domains tables seeded into PostgreSQL schema.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
