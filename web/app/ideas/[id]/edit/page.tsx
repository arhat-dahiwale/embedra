"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getIdea, updateIdea } from "@/lib/api";
import IdeaForm, { IdeaFormData } from "@/components/IdeaForm";
import AuthModal from "@/components/AuthModal";
import { IdeaResponse } from "@embedra/types";

export default function EditIdeaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, isLoading: isAuthLoading } = useAuth();

  const ideaId = params?.id as string;

  const [idea, setIdea] = useState<IdeaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!ideaId) return;

    let isMounted = true;
    async function loadExistingIdea() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getIdea(ideaId, token || undefined);
        if (isMounted) {
          setIdea(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load idea for editing");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadExistingIdea();
    return () => {
      isMounted = false;
    };
  }, [ideaId, token]);

  const handleSubmit = async (formData: IdeaFormData) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await updateIdea(
        ideaId,
        {
          title: formData.title,
          description: formData.description,
          domainId: formData.domainId,
          accessType: formData.accessType,
          status: formData.status,
        },
        token
      );

      // Successfully updated idea; navigate back to view page
      router.push(`/ideas/${ideaId}`);
    } catch (err: any) {
      setError(err.message || "Failed to update idea");
      setIsSubmitting(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        <div className="h-6 w-32 bg-slate-800 animate-pulse rounded-md" />
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
          <div className="h-8 w-1/2 bg-slate-800 animate-pulse rounded-lg" />
          <div className="h-24 w-full bg-slate-800 animate-pulse rounded-lg" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Sign In Required</h1>
        <p className="text-xs text-slate-400">You must be logged in to edit an idea.</p>
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-colors"
          >
            Sign In
          </button>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultMode="login"
        />
      </main>
    );
  }

  if (!idea) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Idea Not Found</h1>
        <p className="text-xs text-slate-400">{error || "Could not retrieve the idea."}</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition-colors"
        >
          ← Back to Home
        </Link>
      </main>
    );
  }

  // Owner check
  if (user.id !== idea.ownerId) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Permission Denied</h1>
        <p className="text-xs text-slate-400">
          Only the owner (@{idea.ownerUsername || "owner"}) can modify this idea.
        </p>
        <div className="pt-4">
          <Link
            href={`/ideas/${idea.id}`}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-200 transition-colors"
          >
            ← Return to Idea Details
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-200 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={`/ideas/${idea.id}`} className="hover:text-slate-200 transition-colors truncate max-w-[200px]">
          {idea.title}
        </Link>
        <span>/</span>
        <span className="text-slate-200">Edit</span>
      </div>

      {/* Page Header */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Edit Idea</h1>
        <p className="text-sm text-slate-400">
          Update the proposal, revise the domain category, or adjust collaboration settings.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
        <IdeaForm
          mode="edit"
          initialData={{
            title: idea.title,
            description: idea.description,
            domainId: idea.domainId,
            accessType: idea.accessType,
            status: idea.status,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
          submitLabel="Save Changes"
          onCancel={() => router.push(`/ideas/${idea.id}`)}
        />
      </div>
    </main>
  );
}
