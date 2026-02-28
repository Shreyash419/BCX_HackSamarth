"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { getProjects } from "@/actions/actions";
import type { CarbonProject, ProjectStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; dot: string }
> = {
  active: { label: "Active", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
  approved: { label: "Approved", color: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  pending: { label: "Pending Review", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
  draft: { label: "Draft", color: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

function IntegrityBar({ score }: { score: number | undefined }) {
  if (score === undefined) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Integrity Score</span>
          <span className="font-medium text-slate-400">Calculating...</span>
        </div>
        <div className="integrity-bar">
          <div className="integrity-fill bg-slate-200 animate-pulse" style={{ width: "100%" }} />
        </div>
      </div>
    );
  }
  if (score === -1) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Integrity Score</span>
          <span className="font-medium text-slate-400">-</span>
        </div>
        <div className="integrity-bar">
          <div className="integrity-fill bg-slate-200" style={{ width: "0%" }} />
        </div>
      </div>
    );
  }
  const color =
    score >= 85 ? "bg-green-500" : score >= 70 ? "bg-amber-400" : "bg-red-400";
  const label =
    score >= 85 ? "Excellent" : score >= 70 ? "Good" : "Needs Attention";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Integrity Score</span>
        <span className="font-medium text-slate-700">{score}/100 · {label}</span>
      </div>
      <div className="integrity-bar">
        <div className={`integrity-fill ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function DeveloperDashboardPage() {
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
    Promise.all(
      projects.map(async (project) => {
        try {
          const res = await fetch("/api/integrity-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: project.description }),
          });
          if (!res.ok) return { id: project.id, score: -1 };
          const data = await res.json();
          return { id: project.id, score: data.score ?? -1 };
        } catch {
          return { id: project.id, score: -1 };
        }
      })
    ).then((results) => {
      const scores: Record<string, number> = {};
      results.forEach((r) => { scores[r.id] = r.score; });
      setIntegrityScores(scores);
    });
  }, [projects]);

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "active").length,
    pending: projects.filter((p) => p.status === "pending").length,
    totalCredits: projects.reduce((s, p) => s + p.totalCredits, 0),
    availableCredits: projects.reduce((s, p) => s + p.availableCredits, 0),
    totalRevenue: projects.reduce(
      (s, p) => s + (p.totalCredits - p.availableCredits) * p.pricePerCredit,
      0
    ),
  };

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Developer Overview</h1>
            <p className="text-sm text-slate-500 mt-1">
              Welcome back, {user?.name?.split(" ")[0]} · {user?.organization}
            </p>
          </div>
          <Link
            href="/developer/register-project"
            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm shadow-green-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Register New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {[
            { label: "Total Projects", value: stats.total, icon: "📋", sub: `${stats.active} active` },
            { label: "Credits Issued", value: stats.totalCredits.toLocaleString("en-IN"), icon: "🌱", sub: "Verified" },
            { label: "Credits Available", value: stats.availableCredits.toLocaleString("en-IN"), icon: "📦", sub: "For sale" },
            {
              label: "Est. Revenue",
              value: `₹${(stats.totalRevenue / 100000).toFixed(1)}L`,
              icon: "💰",
              sub: "From sales",
            },
          ].map((s) => (
            <div key={s.label} className="bcx-card p-4 animate-fade-in-up">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Project Cards */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            My Projects
          </h2>
          {loading ? (
            <div className="grid lg:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="bcx-card p-12 text-center">
              <p className="text-slate-400 text-sm">No projects yet.</p>
              <Link
                href="/developer/register-project"
                className="mt-3 inline-block text-green-600 text-sm font-medium hover:underline"
              >
                Register your first project →
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-4">
              {projects.map((p) => {
                const status = STATUS_CONFIG[p.status];
                const soldPct = ((p.totalCredits - p.availableCredits) / p.totalCredits) * 100;
                return (
                  <div key={p.id} className="bcx-card p-5 space-y-4 animate-fade-in-up">
                    {/* Top */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`bcx-badge border ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1`} />
                            {status.label}
                          </span>
                          <span className="text-xs text-slate-400">{p.sector}</span>
                        </div>
                        <h3 className="mt-2 font-semibold text-slate-900 text-base">{p.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">📍 {p.location} · Vintage {p.vintage}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-slate-900">
                          ₹{p.pricePerCredit.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-slate-400">per credit</p>
                      </div>
                    </div>

                    {/* Integrity */}
                    <IntegrityBar score={integrityScores[p.id]} />

                    {/* Credits progress */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Credits Sold</span>
                        <span className="font-medium text-slate-700">
                          {(p.totalCredits - p.availableCredits).toLocaleString("en-IN")} /{" "}
                          {p.totalCredits.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${soldPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex gap-1">
                        {p.sdgGoals.map((g) => (
                          <span key={g} className="text-xs px-1.5 py-0.5 bg-green-50 text-green-600 rounded font-mono">
                            SDG {g}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/developer/projects?id=${p.id}`}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bcx-card p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Register Project", href: "/developer/register-project", icon: "➕", color: "bg-green-50 border-green-200 text-green-700" },
              { label: "AI Validate", href: "/ai-assistant", icon: "🤖", color: "bg-purple-50 border-purple-200 text-purple-700" },
              { label: "Marketplace", href: "/marketplace", icon: "🏪", color: "bg-blue-50 border-blue-200 text-blue-700" },
              { label: "Ledger", href: "/ledger", icon: "📜", color: "bg-amber-50 border-amber-200 text-amber-700" },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all hover:shadow-sm ${a.color}`}
              >
                <span>{a.icon}</span>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
