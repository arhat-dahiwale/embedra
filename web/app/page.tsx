"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [healthStatus, setHealthStatus] = useState<string>("checking...");
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/v1/health");
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <main className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Embedra</h1>
            <p className="text-slate-400 text-sm mt-1">
              NLP-powered idea formation & collaboration platform
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Phase 0 Foundations
          </span>
        </div>

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
            Frontend endpoint request to <code className="text-slate-300 font-mono">http://localhost:5000/api/v1/health</code>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800">
            <h3 className="font-semibold text-slate-200 mb-1">🔐 Auth Endpoints</h3>
            <p className="text-xs text-slate-400">
              JWT + bcrypt auth enabled on <code className="text-slate-300 font-mono">/auth/signup</code>, <code className="text-slate-300 font-mono">/auth/login</code>, and <code className="text-slate-300 font-mono">/auth/me</code>.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-800/40 border border-slate-800">
            <h3 className="font-semibold text-slate-200 mb-1">🌱 Database Seeded</h3>
            <p className="text-xs text-slate-400">
              Starter rows for skills and domains tables seeded into PostgreSQL schema.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
