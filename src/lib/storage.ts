/**
 * Safari Private Mode safe localStorage wrapper.
 * Safari throws a SecurityError/QuotaExceededError when accessing localStorage in private mode.
 */
export const safeStorage = {
  get: (key: string): string | null => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(key, value);
    } catch {
      // Silently fail in Safari Private Mode
    }
  },
  remove: (key: string): void => {
    try {
      if (typeof window === "undefined") return;
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};
