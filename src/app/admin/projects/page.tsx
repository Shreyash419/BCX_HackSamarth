"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getProjects, approveProject, rejectProject } from "@/actions/actions";
import type { CarbonProject, ProjectStatus } from "@/lib/types";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  approved: "bg-teal-50 text-teal-700 border-teal-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

function IntegrityBar({ score }: { score: number | undefined }) {
  if (score === undefined) {
    return <span className="text-xs text-slate-400 italic">Calculating...</span>;
  }
  if (score === -1) {
    return <span className="text-xs text-slate-400">-</span>;
  }
  const color =
    score >= 85 ? "bg-green-500" : score >= 70 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="integrity-bar flex-1 max-w-24">
        <div className={`integrity-fill ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-700">{score}</span>
    </div>
  );
}

export default function AdminProjectsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<CarbonProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [integrityScores, setIntegrityScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "admin") {
      getProjects().then((p) => {
        setProjects(p);
        setLoading(false);
      });
    }
  }, [user]);

  useEffect(() => {
    if (projects.length === 0) return;

    const fetchIntegrityScore = async (project: CarbonProject) => {
      if (integrityScores[project.id] !== undefined) return;
      try {
        const res = await fetch("/api/integrity-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: project.description }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setIntegrityScores((prev) => ({ ...prev, [project.id]: data.score }));
      } catch {
        setIntegrityScores((prev) => ({ ...prev, [project.id]: -1 }));
      }
    };

    Promise.all(projects.map(fetchIntegrityScore));
  }, [projects]);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id + "-approve");
    const res = await approveProject(id);
    if (res.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "approved" as ProjectStatus } : p))
      );
      showToast("Project approved successfully.", "success");
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id + "-reject");
    const res = await rejectProject(id, "Does not meet BCX standards.");
    if (res.success) {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "rejected" as ProjectStatus } : p))
      );
      showToast("Project rejected.", "error");
    }
    setActionLoading(null);
  };

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-fade-in-up ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Project Registry</h1>
            <p className="text-sm text-slate-500 mt-1">Review, approve, and manage all submitted carbon projects</p>
          </div>
          <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-2">
            {projects.length} total projects
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "pending", "active", "approved", "rejected", "draft"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === s
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== "all" && (
                <span className="ml-1.5 opacity-70">
                  ({projects.filter((p) => p.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bcx-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Developer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sector</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Credits</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Integrity Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No projects found for this filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900 max-w-48 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{p.location}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-600 text-xs max-w-36 truncate">{p.developerName}</td>
                      <td className="px-4 py-4">
                        <span className="bcx-badge bg-slate-50 text-slate-600 border border-slate-200">{p.sector}</span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-slate-700">
                        {p.totalCredits.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-4">
                        <IntegrityBar score={integrityScores[p.id]} />
                      </td>
                      <td className="px-4 py-4">
                        <span className={`bcx-badge border ${STATUS_STYLES[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {p.status === "pending" ? (
                          <div className="flex items-center gap-1.5 justify-end">
                            <button
                              onClick={() => handleApprove(p.id)}
                              disabled={!!actionLoading}
                              className="px-2.5 py-1 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === p.id + "-approve" ? "…" : "Approve"}
                            </button>
                            <button
                              onClick={() => handleReject(p.id)}
                              disabled={!!actionLoading}
                              className="px-2.5 py-1 text-xs font-medium bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 transition-colors"
                            >
                              {actionLoading === p.id + "-reject" ? "…" : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
