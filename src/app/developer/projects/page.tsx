"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getProjects } from "@/actions/actions";
import type { CarbonProject, ProjectStatus } from "@/lib/types";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  approved: "bg-teal-50 text-teal-700 border-teal-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  draft: "bg-slate-50 text-slate-600 border-slate-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function DeveloperProjectsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<CarbonProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [integrityScores, setIntegrityScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "developer")) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user?.role === "developer") {
      getProjects({ developerId: user.id }).then((p) => {
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

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
            <p className="text-sm text-slate-500 mt-1">All carbon projects registered under your account</p>
          </div>
          <Link
            href="/developer/register-project"
            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            + Register New
          </Link>
        </div>

        <div className="bcx-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Project Name", "Sector", "Location", "Vintage", "Total Credits", "Available", "Price/Credit", "Integrity Score", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(9)].map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-3 bg-slate-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <p className="text-slate-400 text-sm">No projects registered yet.</p>
                      <Link href="/developer/register-project" className="text-green-600 text-sm font-medium hover:underline mt-2 inline-block">
                        Register your first project →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 max-w-44 truncate">{p.name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="bcx-badge bg-slate-50 border border-slate-200 text-slate-600">{p.sector}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{p.location}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-700">{p.vintage}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-700 text-right">{p.totalCredits.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-xs font-mono text-green-700 text-right">{p.availableCredits.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-700">₹{p.pricePerCredit.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        {integrityScores[p.id] === undefined ? (
                          <span className="text-xs text-slate-400 italic">Calculating...</span>
                        ) : integrityScores[p.id] === -1 ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${integrityScores[p.id] >= 85 ? "bg-green-500" : integrityScores[p.id] >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${integrityScores[p.id]}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-700 font-medium">{integrityScores[p.id]}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`bcx-badge border ${STATUS_STYLES[p.status]}`}>
                          {p.status}
                        </span>
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
