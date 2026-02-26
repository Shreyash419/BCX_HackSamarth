"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { registerProject } from "@/actions/actions";

const SECTORS = [
  "Renewable Energy",
  "Afforestation",
  "Methane Capture",
  "Energy Efficiency",
  "Blue Carbon",
  "Soil Carbon",
  "Waste Management",
];

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const METHODOLOGIES: Record<string, string[]> = {
  "Renewable Energy": ["ACM0002 - Grid electricity from renewable sources", "ACM0018 - Electricity generation from biomass"],
  "Afforestation": ["AR-AM0014 - Afforestation on degraded lands", "AR-AMS0007 - Afforestation and reforestation"],
  "Methane Capture": ["AMS-III.D - Methane recovery in agriculture", "ACM0010 - GHG emission reductions from manure"],
  "Energy Efficiency": ["AMS-I.C - Thermal energy production", "AMS-II.C - Energy efficiency improvements"],
  "Blue Carbon": ["VM0033 - Tidal wetland and seagrass restoration", "VM0007 - REDD+ Methodology"],
  "Soil Carbon": ["VM0042 - Improved agricultural land management", "AMS-III.BF - Soil carbon in croplands"],
  "Waste Management": ["ACM0022 - Alternative waste treatment", "AMS-III.F - Avoidance of methane from landfill"],
};

const SDG_OPTIONS = [
  { id: 1, label: "No Poverty" }, { id: 2, label: "Zero Hunger" },
  { id: 3, label: "Good Health" }, { id: 6, label: "Clean Water" },
  { id: 7, label: "Clean Energy" }, { id: 8, label: "Decent Work" },
  { id: 11, label: "Sustainable Cities" }, { id: 13, label: "Climate Action" },
  { id: 14, label: "Life Below Water" }, { id: 15, label: "Life on Land" },
];

export default function RegisterProjectPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    sector: "Renewable Energy",
    location: "",
    state: "Rajasthan",
    methodology: "",
    co2Reduction: "",
    totalCredits: "",
    pricePerCredit: "",
    vintage: new Date().getFullYear().toString(),
    description: "",
    sdgGoals: [] as number[],
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "developer")) router.push("/login");
  }, [user, isLoading, router]);

  const set = (key: keyof typeof form, value: string | number[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSDG = (id: number) => {
    const current = form.sdgGoals;
    set("sdgGoals", current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  };

  const methodologyOptions = METHODOLOGIES[form.sector] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await registerProject({
      ...form,
      sector: form.sector as import("@/lib/types").ProjectSector,
      co2Reduction: parseInt(form.co2Reduction),
      totalCredits: parseInt(form.totalCredits),
      pricePerCredit: parseInt(form.pricePerCredit),
      vintage: parseInt(form.vintage),
      developerId: user?.id ?? "",
      developerName: user?.organization ?? "",
      status: "pending",
    });
    setSubmitting(false);
    if (res.success) {
      setSuccess(res.projectId!);
    }
  };

  if (success) {
    return (
      <AppShell>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="bcx-card p-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center text-3xl">
              ✅
            </div>
            <h2 className="text-xl font-bold text-slate-900">Project Submitted!</h2>
            <p className="text-slate-600 text-sm">
              Your project has been submitted for review. The BCX Registry will verify your documentation and AI integrity analysis will begin shortly.
            </p>
            <div className="bg-slate-50 rounded-lg p-3 font-mono text-xs text-slate-600">
              Project ID: <strong>{success}</strong>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push("/developer/projects")}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                View My Projects
              </button>
              <button
                onClick={() => { setSuccess(null); setStep(1); setForm({ name: "", sector: "Renewable Energy", location: "", state: "Rajasthan", methodology: "", co2Reduction: "", totalCredits: "", pricePerCredit: "", vintage: new Date().getFullYear().toString(), description: "", sdgGoals: [] }); }}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Register Another
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Register Carbon Project</h1>
          <p className="text-sm text-slate-500 mt-1">
            Submit your project for BCX registry approval and credit issuance
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {["Project Info", "Methodology", "Credits & Pricing"].map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`flex items-center gap-2 cursor-pointer`}
                onClick={() => setStep(i + 1)}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step > i + 1
                      ? "bg-green-600 text-white"
                      : step === i + 1
                      ? "bg-green-600 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? "text-green-700" : "text-slate-400"}`}>
                  {s}
                </span>
              </div>
              {i < 2 && <div className={`flex-1 h-px ${step > i + 1 ? "bg-green-300" : "bg-slate-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bcx-card p-6 space-y-5">
            {step === 1 && (
              <>
                <h3 className="text-sm font-semibold text-slate-900">Project Information</h3>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Project Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                    placeholder="e.g. Rajasthan Wind Farm Phase 2"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Sector *</label>
                    <select
                      value={form.sector}
                      onChange={(e) => { set("sector", e.target.value); set("methodology", ""); }}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      {SECTORS.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">State *</label>
                    <select
                      value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      {STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Location *</label>
                  <input
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    required
                    placeholder="e.g. Jaisalmer, Rajasthan"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Project Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe the carbon reduction activities, impact, and methodology…"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">UN SDG Goals Alignment</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SDG_OPTIONS.map((sdg) => (
                      <label key={sdg.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs ${form.sdgGoals.includes(sdg.id) ? "bg-green-50 border-green-300 text-green-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <input
                          type="checkbox"
                          checked={form.sdgGoals.includes(sdg.id)}
                          onChange={() => toggleSDG(sdg.id)}
                          className="sr-only"
                        />
                        <span className="font-bold">{sdg.id}</span>
                        {sdg.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!form.name || !form.location}
                  className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                >
                  Next: Methodology →
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-sm font-semibold text-slate-900">Methodology & Baselines</h3>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Approved Methodology *</label>
                  <select
                    value={form.methodology}
                    onChange={(e) => set("methodology", e.target.value)}
                    required
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Select methodology…</option>
                    {methodologyOptions.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Select an UNFCCC/Verra approved methodology for {form.sector}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">CO₂ Reduction (tCO₂e) *</label>
                    <input
                      type="number"
                      value={form.co2Reduction}
                      onChange={(e) => set("co2Reduction", e.target.value)}
                      required
                      placeholder="e.g. 50000"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Vintage Year *</label>
                    <input
                      type="number"
                      value={form.vintage}
                      onChange={(e) => set("vintage", e.target.value)}
                      min={2018}
                      max={2030}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-800 mb-1">📋 Required Documents (to upload post-registration)</p>
                  <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                    <li>Project Design Document (PDD)</li>
                    <li>Baseline & Monitoring Report (MRV)</li>
                    <li>Third-party validation certificate</li>
                    <li>Land ownership / lease documents</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!form.methodology || !form.co2Reduction}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors"
                  >
                    Next: Credits →
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-sm font-semibold text-slate-900">Credits & Pricing</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Total Credits to Issue *</label>
                    <input
                      type="number"
                      value={form.totalCredits}
                      onChange={(e) => set("totalCredits", e.target.value)}
                      required
                      placeholder="e.g. 50000"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    />
                    <p className="text-xs text-slate-400 mt-1">1 credit = 1 tCO₂e reduced</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Price per Credit (₹) *</label>
                    <input
                      type="number"
                      value={form.pricePerCredit}
                      onChange={(e) => set("pricePerCredit", e.target.value)}
                      required
                      placeholder="e.g. 850"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    />
                  </div>
                </div>

                {form.totalCredits && form.pricePerCredit && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <p className="text-xs text-green-700 font-medium">Estimated Market Value</p>
                    <p className="text-xl font-bold text-green-800 mt-1">
                      ₹{(parseInt(form.totalCredits) * parseInt(form.pricePerCredit)).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {parseInt(form.totalCredits).toLocaleString("en-IN")} credits × ₹{parseInt(form.pricePerCredit).toLocaleString("en-IN")}
                    </p>
                  </div>
                )}

                {/* Summary */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900 mb-2">Submission Summary</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-slate-500">Project:</span><span className="font-medium truncate">{form.name || "—"}</span>
                    <span className="text-slate-500">Sector:</span><span className="font-medium">{form.sector}</span>
                    <span className="text-slate-500">Location:</span><span className="font-medium truncate">{form.location || "—"}</span>
                    <span className="text-slate-500">Vintage:</span><span className="font-medium">{form.vintage}</span>
                    <span className="text-slate-500">CO₂ Reduction:</span><span className="font-medium">{form.co2Reduction ? `${parseInt(form.co2Reduction).toLocaleString("en-IN")} tCO₂e` : "—"}</span>
                    <span className="text-slate-500">SDG Goals:</span><span className="font-medium">{form.sdgGoals.join(", ") || "None"}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !form.totalCredits || !form.pricePerCredit}
                    className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting…
                      </>
                    ) : (
                      "Submit for Review ✓"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
