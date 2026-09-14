"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createIdea } from "@/lib/api";
import IdeaForm, { IdeaFormData } from "@/components/IdeaForm";
import AuthModal from "@/components/AuthModal";

export default function CreateIdeaPage() {
  const router = useRouter();
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSubmit = async (formData: IdeaFormData) => {
    if (!token) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const result = await createIdea(
        {
          title: formData.title,
          description: formData.description,
          domainId: formData.domainId,
          accessType: formData.accessType,
          status: "open",
        },
        token
      );

      // Successfully created idea; navigate to view page
      router.push(`/ideas/${result.idea.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create idea");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-200 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-200">New Idea</span>
      </div>

      {/* Page Header */}
      <div className="space-y-2 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Create New Idea</h1>
        <p className="text-sm text-slate-400">
          Form an initial proposal, assign a primary domain, and prepare it for collaboration.
        </p>
      </div>

      {/* Authentication Check */}
      {!isAuthLoading && !user ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-white">Authentication Required</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You must be signed in to create an idea and manage its formation group.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-indigo-500/20"
            >
              Sign In to Continue
            </button>
          </div>
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            defaultMode="login"
          />
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-xl">
          <IdeaForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
            submitLabel="Publish Idea"
            onCancel={() => router.push("/")}
          />
        </div>
      )}
    </main>
  );
}
