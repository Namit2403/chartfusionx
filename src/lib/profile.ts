const PROFILE_KEY = "cfx-profile";

export type UserProfile = {
  legalAcceptedAt?: string; // ISO timestamp
  legalAcceptedVersion?: string;
  onboardingDismissedAt?: string; // ISO timestamp — user closed the first-run checklist
  onboardingCompletedAt?: string; // ISO timestamp — every checklist step finished
  usageBudget?: UsageBudget;
};

export type UsageBudget = {
  /** AI actions per month the user allows before the cap is hit. */
  monthlyCap: number;
  /** Percent of cap where the "approaching budget" alert fires. */
  warnThreshold: number;
  /** Percent of cap where the critical alert fires. Kept >= warnThreshold. */
  criticalThreshold: number;
  /** When true, AI actions pause entirely at the cap instead of just flagging. */
  hardStop: boolean;
};

export const DEFAULT_USAGE_BUDGET: UsageBudget = {
  monthlyCap: 50,
  warnThreshold: 75,
  criticalThreshold: 90,
  hardStop: false,
};

/** Bump when legal documents change materially so acceptance is re-requested. */
export const LEGAL_VERSION = "2026-08-10";

export function readProfile(): UserProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : {};
  } catch {
    return {};
  }
}

export function writeProfile(patch: Partial<UserProfile>) {
  if (typeof window === "undefined") return;
  try {
    const next = { ...readProfile(), ...patch };
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function recordLegalAcceptance(at: Date = new Date()) {
  writeProfile({ legalAcceptedAt: at.toISOString(), legalAcceptedVersion: LEGAL_VERSION });
}

export function hasAcceptedLegal(profile: UserProfile = readProfile()) {
  return Boolean(profile.legalAcceptedAt) && profile.legalAcceptedVersion === LEGAL_VERSION;
}

export function hasDismissedOnboarding(profile: UserProfile = readProfile()) {
  return Boolean(profile.onboardingDismissedAt);
}

export function recordOnboardingDismissed(at: Date = new Date()) {
  writeProfile({ onboardingDismissedAt: at.toISOString() });
}

export function hasCompletedOnboarding(profile: UserProfile = readProfile()) {
  return Boolean(profile.onboardingCompletedAt);
}

export function recordOnboardingCompleted(at: Date = new Date()) {
  writeProfile({ onboardingCompletedAt: at.toISOString() });
}

/** Merges per-field defaults, so profiles stored before this feature read correctly. */
export function readUsageBudget(profile: UserProfile = readProfile()): UsageBudget {
  return { ...DEFAULT_USAGE_BUDGET, ...(profile.usageBudget ?? {}) };
}

export function writeUsageBudget(patch: Partial<UsageBudget>) {
  writeProfile({ usageBudget: { ...readUsageBudget(), ...patch } });
}
