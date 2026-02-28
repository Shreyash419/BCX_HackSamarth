"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useCart } from "@/context/CartContext";
import { getMarketplaceData } from "@/actions/actions";
import type { CarbonProject } from "@/lib/types";

const SECTORS = [
  "All",
  "Renewable Energy",
  "Afforestation",
  "Methane Capture",
  "Energy Efficiency",
  "Blue Carbon",
  "Soil Carbon",
  "Waste Management",
];

function IntegrityBadge({ score }: { score: number | undefined }) {
  if (score === undefined) {
    return <span className="bcx-badge border text-[11px] bg-slate-50 text-slate-400 border-slate-200 italic">Calculating...</span>;
  }
  if (score === -1) {
    return <span className="bcx-badge border text-[11px] bg-slate-50 text-slate-400 border-slate-200">-</span>;
  }
  const { color, label } =
    score >= 85
      ? { color: "bg-green-50 text-green-700 border-green-200", label: "★ Excellent" }
      : score >= 70
      ? { color: "bg-amber-50 text-amber-700 border-amber-200", label: "◆ Good" }
      : { color: "bg-red-50 text-red-700 border-red-200", label: "▼ Fair" };
  return (
    <span className={`bcx-badge border text-[11px] ${color}`}>
      {label} · {score}/100
    </span>
  );
}

function ProjectCard({
  project,
  integrityScore,
  onAddToCart,
}: {
  project: CarbonProject;
  integrityScore: number | undefined;
  onAddToCart: (p: CarbonProject, qty: number) => void;
}) {
  const [qty, setQty] = useState(100);
  const [expanded, setExpanded] = useState(false);

  const displayScore = integrityScore !== undefined && integrityScore !== -1 ? integrityScore : 0;
  const barColor =
    displayScore >= 85
      ? "bg-green-500"
      : displayScore >= 70
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <div className="bcx-card overflow-hidden hover:shadow-md transition-shadow animate-fade-in-up">
      {/* Header stripe */}
      <div className="h-1 bg-gradient-to-r from-green-400 to-teal-500" />

      <div className="p-5 space-y-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400">{project.sector}</span>
              <span className="text-xs text-slate-300">·</span>
              <span className="text-xs text-slate-400">Vintage {project.vintage}</span>
            </div>
            <h3 className="mt-1 font-semibold text-slate-900 text-sm leading-snug">{project.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">📍 {project.location}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xl font-bold text-slate-900">₹{project.pricePerCredit.toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-400">/ credit</p>
          </div>
        </div>

        {/* Integrity */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Integrity Score</span>
            <IntegrityBadge score={integrityScore} />
          </div>
          {integrityScore !== undefined && integrityScore !== -1 && (
            <div className="integrity-bar">
              <div
                className={`integrity-fill ${barColor}`}
                style={{ width: `${displayScore}%` }}
              />
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Available:{" "}
            <span className="font-medium text-slate-800">
              {project.availableCredits.toLocaleString("en-IN")}
            </span>
          </span>
          <span className="text-slate-500">
            CO₂:{" "}
            <span className="font-medium text-slate-800">
              {(project.co2Reduction / 1000).toFixed(0)}K t
            </span>
          </span>
        </div>

        {/* SDG Tags */}
        <div className="flex gap-1 flex-wrap">
          {project.sdgGoals.map((g) => (
            <span
              key={g}
              className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100 font-mono"
            >
              SDG {g}
            </span>
          ))}
        </div>

        {/* Description toggle */}
        {expanded && (
          <p className="text-xs text-slate-600 leading-relaxed">{project.description}</p>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-500 hover:text-blue-600"
        >
          {expanded ? "Show less" : "Read more"}
        </button>

        {/* Buy action */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={project.availableCredits}
            value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-center"
          />
          <div className="flex-1">
            <p className="text-[11px] text-slate-400">
              Total: ₹{(qty * project.pricePerCredit).toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={() => onAddToCart(project, qty)}
            className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors flex-shrink-0"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { addItem, totalItems } = useCart();
  const [projects, setProjects] = useState<CarbonProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [sortBy, setSortBy] = useState<"price" | "score" | "credits">("score");
  const [toast, setToast] = useState("");
  const [integrityScores, setIntegrityScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      getMarketplaceData().then((p) => {
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

  const filtered = useMemo(() => {
    let res = [...projects];
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.sector.toLowerCase().includes(q)
      );
    }
    if (sector !== "All") res = res.filter((p) => p.sector === sector);

    res.sort((a, b) => {
      if (sortBy === "price") return a.pricePerCredit - b.pricePerCredit;
      if (sortBy === "score") return (integrityScores[b.id] ?? 0) - (integrityScores[a.id] ?? 0);
      return b.availableCredits - a.availableCredits;
    });
    return res;
  }, [projects, search, sector, sortBy, integrityScores]);

  const handleAddToCart = (project: CarbonProject, qty: number) => {
    addItem({
      projectId: project.id,
      projectName: project.name,
      quantity: qty,
      pricePerCredit: project.pricePerCredit,
    });
    setToast(`${qty} credits from ${project.name.slice(0, 30)}… added to cart`);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <AppShell>
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium bg-green-600 text-white animate-fade-in-up max-w-xs">
          ✓ {toast}
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Carbon Credit Marketplace</h1>
            <p className="text-sm text-slate-500 mt-1">
              Browse verified, BCX-certified carbon credits from across India
            </p>
          </div>
          {totalItems > 0 && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="text-green-700 text-sm font-medium">🛒 {totalItems} credits in cart</span>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search projects, locations, sectors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="score">Sort: Integrity Score</option>
            <option value="price">Sort: Price (Low–High)</option>
            <option value="credits">Sort: Available Credits</option>
          </select>
        </div>

        {/* Sector Filter */}
        <div className="flex gap-2 flex-wrap">
          {SECTORS.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                sector === s
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-slate-500">
          {loading ? "Loading…" : `${filtered.length} projects found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bcx-card p-12 text-center">
            <p className="text-slate-400">No projects match your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} integrityScore={integrityScores[p.id]} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
