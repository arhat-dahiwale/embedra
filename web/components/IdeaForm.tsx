"use client";

import React, { useEffect, useState } from "react";
import { Domain, createIdeaSchema } from "@embedra/types";
import { getDomains } from "@/lib/api";

export interface IdeaFormData {
  title: string;
  description: string;
  domainId: string;
  accessType: "open_open" | "open_closed" | "closed";
  status?: "open" | "closed";
}

interface IdeaFormProps {
  mode: "create" | "edit";
  initialData?: Partial<IdeaFormData>;
  onSubmit: (data: IdeaFormData) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  submitLabel?: string;
  onCancel?: () => void;
}

export default function IdeaForm({
  mode,
  initialData,
  onSubmit,
  isSubmitting,
  error,
  submitLabel,
  onCancel,
}: IdeaFormProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(true);
  const [domainError, setDomainError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [domainId, setDomainId] = useState(initialData?.domainId || "");
  const [accessType, setAccessType] = useState<"open_open" | "open_closed" | "closed">(
    initialData?.accessType || "open_open"
  );
  const [status, setStatus] = useState<"open" | "closed">(initialData?.status || "open");

  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadDomains() {
      try {
        setIsLoadingDomains(true);
        const data = await getDomains();
        if (isMounted) {
          setDomains(data);
          if (!domainId && data.length > 0 && !initialData?.domainId) {
            setDomainId(data[0].id);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setDomainError("Failed to load fixed domain list from server.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDomains(false);
        }
      }
    }

    loadDomains();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update state when initialData changes (e.g. after async fetch in edit mode)
  useEffect(() => {
    if (initialData) {
      if (initialData.title !== undefined) setTitle(initialData.title);
      if (initialData.description !== undefined) setDescription(initialData.description);
      if (initialData.domainId !== undefined) setDomainId(initialData.domainId);
      if (initialData.accessType !== undefined) setAccessType(initialData.accessType);
      if (initialData.status !== undefined) setStatus(initialData.status);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientErrors({});

    const formData: IdeaFormData = {
      title: title.trim(),
      description: description.trim(),
      domainId,
      accessType,
      ...(mode === "edit" ? { status } : {}),
    };

    // Client-side Zod validation
    const validation = createIdeaSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path[0]?.toString();
        if (path && !fieldErrors[path]) {
          fieldErrors[path] = err.message;
        }
      });
      setClientErrors(fieldErrors);
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Server or Global Error Banner */}
      {(error || domainError) && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm flex items-start space-x-3">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-semibold">{error || domainError}</p>
          </div>
        </div>
      )}

      {/* Title Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="idea-title" className="block text-sm font-semibold text-slate-200">
            Idea Title <span className="text-rose-400">*</span>
          </label>
          <span className={`text-xs ${title.length > 120 ? "text-rose-400 font-semibold" : "text-slate-500"}`}>
            {title.length}/120
          </span>
        </div>
        <input
          id="idea-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Real-Time Collaborative Research Graph"
          className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none transition-colors ${
            clientErrors.title
              ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30"
              : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          }`}
        />
        {clientErrors.title && (
          <p className="text-xs text-rose-400 font-medium">{clientErrors.title}</p>
        )}
      </div>

      {/* Domain Selection */}
      <div className="space-y-2">
        <label htmlFor="idea-domain" className="block text-sm font-semibold text-slate-200">
          Domain <span className="text-rose-400">*</span>
        </label>
        <p className="text-xs text-slate-400">
          Domains are categorized from Embedra&apos;s verified lookup taxonomy.
        </p>
        <div className="relative">
          <select
            id="idea-domain"
            value={domainId}
            disabled={isLoadingDomains || domains.length === 0}
            onChange={(e) => setDomainId(e.target.value)}
            className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-slate-100 text-sm appearance-none focus:outline-none transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
              clientErrors.domainId
                ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30"
                : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            }`}
          >
            {isLoadingDomains ? (
              <option value="">Loading domains...</option>
            ) : domains.length === 0 ? (
              <option value="">No domains available</option>
            ) : (
              domains.map((dom) => (
                <option key={dom.id} value={dom.id} className="bg-slate-900 text-slate-100">
                  {dom.name}
                </option>
              ))
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {clientErrors.domainId && (
          <p className="text-xs text-rose-400 font-medium">{clientErrors.domainId}</p>
        )}
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="idea-description" className="block text-sm font-semibold text-slate-200">
            Description (README) <span className="text-rose-400">*</span>
          </label>
          <span className={`text-xs ${description.length < 10 ? "text-amber-400" : "text-slate-500"}`}>
            {description.length} chars (min 10)
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Write a clear overview of the problem, proposed solution, and initial architecture.
        </p>
        <textarea
          id="idea-description"
          rows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain the background problem, goals, requirements, and tech stack in detail..."
          className={`w-full px-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 text-sm leading-relaxed focus:outline-none transition-colors ${
            clientErrors.description
              ? "border-rose-500 focus:ring-2 focus:ring-rose-500/30"
              : "border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
          }`}
        />
        {clientErrors.description && (
          <p className="text-xs text-rose-400 font-medium">{clientErrors.description}</p>
        )}
      </div>

      {/* Access Type Cards */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-200">
          Access & Collaboration Type
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              accessType === "open_open"
                ? "bg-indigo-500/10 border-indigo-500 text-white shadow-sm"
                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-indigo-400 uppercase tracking-wider">
                Open + Open
              </span>
              <input
                type="radio"
                name="accessType"
                value="open_open"
                checked={accessType === "open_open"}
                onChange={() => setAccessType("open_open")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-400">
              Publicly visible. Anyone can request to join immediately.
            </p>
          </label>

          <label
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              accessType === "open_closed"
                ? "bg-indigo-500/10 border-indigo-500 text-white shadow-sm"
                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-cyan-400 uppercase tracking-wider">
                Open + Closed
              </span>
              <input
                type="radio"
                name="accessType"
                value="open_closed"
                checked={accessType === "open_closed"}
                onChange={() => setAccessType("open_closed")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-400">
              Publicly visible idea. Joining requires an invite link from the owner.
            </p>
          </label>

          <label
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              accessType === "closed"
                ? "bg-indigo-500/10 border-indigo-500 text-white shadow-sm"
                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-xs text-amber-400 uppercase tracking-wider">
                Closed
              </span>
              <input
                type="radio"
                name="accessType"
                value="closed"
                checked={accessType === "closed"}
                onChange={() => setAccessType("closed")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-400">
              Private workspace. Strictly invite-only.
            </p>
          </label>
        </div>
      </div>

      {/* Status (Edit mode only) */}
      {mode === "edit" && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <label className="block text-sm font-semibold text-slate-200">
            Idea Status
          </label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="open"
                checked={status === "open"}
                onChange={() => setStatus("open")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Open (Active collaboration)</span>
              </span>
            </label>
            <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="closed"
                checked={status === "closed"}
                onChange={() => setStatus("closed")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Closed (Archived)</span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || isLoadingDomains}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center space-x-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving Idea...</span>
            </>
          ) : (
            <span>{submitLabel || (mode === "create" ? "Create Idea" : "Update Idea")}</span>
          )}
        </button>
      </div>
    </form>
  );
}
