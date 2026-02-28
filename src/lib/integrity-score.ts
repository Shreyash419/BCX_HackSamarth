/**
 * Heuristic keyword-based Integrity Score calculator for carbon credit projects.
 *
 * Integrity Score =
 *   (Additionality × 0.25) +
 *   (Permanence   × 0.20) +
 *   (MRV          × 0.20) +
 *   (Leakage      × 0.15) +
 *   (RegistryQuality        × 0.10) +
 *   (CorrespondingAdjustment × 0.10)
 *
 * Each parameter is scored 30–95 via keyword heuristics + controlled randomness.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface IntegrityParameters {
  additionality: number;
  permanence: number;
  mrv: number;
  leakage: number;
  registryQuality: number;
  correspondingAdjustment: number;
}

export interface IntegrityScoreResult {
  score: number;
  parameters: IntegrityParameters;
}

// ── Keyword rule sets ───────────────────────────────────────────────────────

interface KeywordRule {
  /** Regex patterns (case-insensitive) to search for in the description. */
  patterns: RegExp[];
  /** Points added per matched pattern (before clamping). */
  weight: number;
}

const ADDITIONALITY_RULES: KeywordRule[] = [
  { patterns: [/\bnew\b/i, /\binnovati/i, /\bfirst[- ]of[- ]its[- ]kind\b/i], weight: 8 },
  { patterns: [/\badditionality\b/i, /\bbeyond[- ]?bau\b/i, /\bbusiness[- ]as[- ]usual\b/i], weight: 10 },
  { patterns: [/\bnovel\b/i, /\bpioneering\b/i, /\bbreakthrough\b/i], weight: 7 },
  { patterns: [/\brenewable\b/i, /\bclean\s?energy\b/i], weight: 5 },
];

const PERMANENCE_RULES: KeywordRule[] = [
  { patterns: [/\blong[- ]term\b/i, /\bpermanent\b/i, /\b100\s?years?\b/i, /\bdurable\b/i], weight: 9 },
  { patterns: [/\bpermanence\b/i, /\birreversib/i], weight: 10 },
  { patterns: [/\bsequestration\b/i, /\bstorage\b/i, /\bgeologic/i], weight: 6 },
  { patterns: [/\bafforestation\b/i, /\breforestation\b/i], weight: 5 },
];

const MRV_RULES: KeywordRule[] = [
  { patterns: [/\baudit/i, /\bverification\b/i, /\bISO\b/, /\bmonitoring\b/i, /\bMRV\b/], weight: 8 },
  { patterns: [/\bthird[- ]party\b/i, /\bindependent\b/i], weight: 7 },
  { patterns: [/\bsatellite\b/i, /\bremote\s?sensing\b/i, /\bIoT\b/i], weight: 6 },
  { patterns: [/\breport/i, /\btransparent/i, /\baccountab/i], weight: 5 },
];

const LEAKAGE_RULES: KeywordRule[] = [
  { patterns: [/\brisk\b/i, /\bdeforestation\s?shift\b/i, /\bleakage\s?control\b/i], weight: 9 },
  { patterns: [/\bleakage\b/i, /\bdisplacement\b/i], weight: 8 },
  { patterns: [/\bbuffer\b/i, /\bsafeguard/i, /\bmitigation\b/i], weight: 6 },
  { patterns: [/\bboundary\b/i, /\bbaseline\b/i], weight: 4 },
];

const REGISTRY_QUALITY_RULES: KeywordRule[] = [
  { patterns: [/\bVerra\b/i, /\bGold\s?Standard\b/i, /\bregistry\b/i, /\btracking\b/i], weight: 9 },
  { patterns: [/\bACR\b/, /\bCAR\b/, /\bPlan\s?Vivo\b/i], weight: 8 },
  { patterns: [/\bserial\s?number/i, /\bretire/i, /\bcancel/i], weight: 5 },
  { patterns: [/\bcertif/i, /\baccredit/i], weight: 6 },
];

const CORRESPONDING_ADJUSTMENT_RULES: KeywordRule[] = [
  { patterns: [/\bParis\s?Agreement\b/i, /\bdouble\s?counting\b/i, /\bcorresponding\s?adjustment\b/i], weight: 10 },
  { patterns: [/\bArticle\s?6\b/i, /\bNDC\b/, /\bITMO\b/i], weight: 9 },
  { patterns: [/\bhost\s?country\b/i, /\bletter\s?of\s?(authorization|approval)\b/i], weight: 7 },
  { patterns: [/\bsovereign/i, /\bjurisdiction/i], weight: 4 },
];

// ── Weights for final score ─────────────────────────────────────────────────

const PARAMETER_WEIGHTS: Record<keyof IntegrityParameters, number> = {
  additionality: 0.25,
  permanence: 0.20,
  mrv: 0.20,
  leakage: 0.15,
  registryQuality: 0.10,
  correspondingAdjustment: 0.10,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const BASE_SCORE = 45;
const MIN_SCORE = 30;
const MAX_SCORE = 95;
const JITTER_RANGE = 10; // ±5 → total span of 10
const KEYWORD_SCALING = 1.20; // amplify keyword contributions for realistic spread

/** Evaluate keyword rules, apply scaling to keyword contributions. */
function evaluateRules(text: string, rules: KeywordRule[]): number {
  let keywordPoints = 0;
  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        keywordPoints += rule.weight;
      }
    }
  }
  return BASE_SCORE + keywordPoints * KEYWORD_SCALING;
}

/** Add controlled randomness in the range [−half, +half). */
function applyJitter(value: number, range: number = JITTER_RANGE): number {
  const half = range / 2;
  return value + (Math.random() * range - half);
}

/** Clamp a number to [min, max] and round to the nearest integer. */
function clampAndRound(value: number, min: number = MIN_SCORE, max: number = MAX_SCORE): number {
  return Math.round(Math.min(max, Math.max(min, value)));
}

// ── Main export ─────────────────────────────────────────────────────────────

/**
 * Calculate an Integrity Score for a carbon credit project from its
 * description text using keyword heuristics and controlled randomness.
 *
 * @param description - Free-text project description.
 * @returns An object with the overall `score` (0–100) and the six
 *          individual `parameters` (each 30–95).
 */
export function calculateIntegrityScoreFromDescription(
  description: string,
): IntegrityScoreResult {
  const text = description ?? "";

  // 1. Evaluate each parameter via keyword rules
  const rawAdditionality = evaluateRules(text, ADDITIONALITY_RULES);
  const rawPermanence = evaluateRules(text, PERMANENCE_RULES);
  const rawMrv = evaluateRules(text, MRV_RULES);
  const rawLeakage = evaluateRules(text, LEAKAGE_RULES);
  const rawRegistryQuality = evaluateRules(text, REGISTRY_QUALITY_RULES);
  const rawCA = evaluateRules(text, CORRESPONDING_ADJUSTMENT_RULES);

  // 2. Apply jitter then clamp to [30, 95]
  const parameters: IntegrityParameters = {
    additionality: clampAndRound(applyJitter(rawAdditionality)),
    permanence: clampAndRound(applyJitter(rawPermanence)),
    mrv: clampAndRound(applyJitter(rawMrv)),
    leakage: clampAndRound(applyJitter(rawLeakage)),
    registryQuality: clampAndRound(applyJitter(rawRegistryQuality)),
    correspondingAdjustment: clampAndRound(applyJitter(rawCA)),
  };

  // 3. Weighted sum → normalized final score with diminishing returns (30–95)
  const weightedSum =
    parameters.additionality * PARAMETER_WEIGHTS.additionality +
    parameters.permanence * PARAMETER_WEIGHTS.permanence +
    parameters.mrv * PARAMETER_WEIGHTS.mrv +
    parameters.leakage * PARAMETER_WEIGHTS.leakage +
    parameters.registryQuality * PARAMETER_WEIGHTS.registryQuality +
    parameters.correspondingAdjustment * PARAMETER_WEIGHTS.correspondingAdjustment;

  // Diminishing returns: pow < 1 compresses high sums, factor 0.6 softens overall contribution
  const adjustedScore = BASE_SCORE + Math.pow(weightedSum, 0.9) * 0.6;
  const score = Math.round(Math.min(MAX_SCORE, Math.max(MIN_SCORE, adjustedScore)));

  return { score, parameters };
}
