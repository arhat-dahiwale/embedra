"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getIdea } from "@/lib/api";
import { IdeaResponse } from "@embedra/types";

export default function ViewIdeaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const ideaId = params?.id as string;

  const [idea, setIdea] = useState<IdeaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  useEffect(() => {
    if (!ideaId) return;

    let isMounted = true;
    async function fetchIdeaData() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getIdea(ideaId, token || undefined);
        if (isMounted) {
          setIdea(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load idea");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchIdeaData();
    return () => {
      isMounted = false;
    };
  }, [ideaId, token]);

  const isOwner = user && idea && user.id === idea.ownerId;

  const copyInviteLink = () => {
    if (!idea?.inviteToken) return;
    const url = `${window.location.origin}/ideas/join-via-invite/${idea.inviteToken}`;
    navigator.clipboard.writeText(url);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="h-6 w-32 bg-slate-800 animate-pulse rounded-md" />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="h-10 w-3/4 bg-slate-800 animate-pulse rounded-lg" />
          <div className="flex space-x-3">
            <div className="h-6 w-24 bg-slate-800 animate-pulse rounded-full" />
            <div className="h-6 w-24 bg-slate-800 animate-pulse rounded-full" />
          </div>
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="h-4 w-full bg-slate-800 animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-slate-800 animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-slate-800 animate-pulse rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !idea) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Idea Not Found</h1>
        <p className="text-xs text-slate-400">{error || "The requested idea could not be retrieved."}</p>
        <div className="pt-4">
          <Link
            href="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-200 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-200">Idea Details</span>
        </div>

        {isOwner && (
          <Link
            href={`/ideas/${idea.id}/edit`}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl shadow-md shadow-indigo-500/20 transition-colors flex items-center space-x-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Idea</span>
          </Link>
        )}
      </div>

      {/* Main Idea Card */}
      <article className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Domain Badge */}
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {idea.domainName || "Domain"}
          </span>

          {/* Status Badge */}
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center space-x-1.5 ${
              idea.status === "open"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                idea.status === "open" ? "bg-emerald-400" : "bg-slate-400"
              }`}
            />
            <span className="capitalize">{idea.status}</span>
          </span>

          {/* Access Type Badge */}
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-800/80 text-slate-300 border border-slate-700">
            {idea.accessType === "open_open"
              ? "Open + Open"
              : idea.accessType === "open_closed"
              ? "Open + Closed"
              : "Closed"}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
          {idea.title}
        </h1>

        {/* Owner & Creation Time Header */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80 gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
              {(idea.ownerUsername || "U").charAt(0).toUpperCase()}
            </div>
            <span>
              Formed by <strong className="text-slate-200">@{idea.ownerUsername || "anonymous"}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <span>{new Date(idea.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</span>
            {idea.memberCount !== undefined && (
              <span>• {idea.memberCount} {idea.memberCount === 1 ? "contributor" : "contributors"}</span>
            )}
          </div>
        </div>

        {/* Invite Token Banner (Owner Only for open_closed ideas) */}
        {isOwner && idea.inviteToken && (
          <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Private Invite Token
              </span>
              <button
                type="button"
                onClick={copyInviteLink}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
              >
                {copiedInvite ? "Copied Link!" : "Copy Invite Link"}
              </button>
            </div>
            <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 break-all select-all">
              {idea.inviteToken}
            </p>
          </div>
        )}

        {/* README-style Description */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            README & Proposal Overview
          </h2>
          <div className="p-6 bg-slate-950/70 border border-slate-800/70 rounded-xl text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
            {idea.description}
          </div>
        </div>
      </article>
    </main>
  );
}
