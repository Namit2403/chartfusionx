const PROFILE_KEY = "cfx-profile";

export type UserProfile = {
  legalAcceptedAt?: string; // ISO timestamp
  legalAcceptedVersion?: string;
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
