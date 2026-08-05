/**
 * Safari-safe storage wrapper.
 *
 * Older Safari private browsing throws on localStorage access.
 * This wrapper catches the error and falls back to an in-memory store
 * so the app never crashes from storage access.
 */

class SafeStorage implements Storage {
  private _store: Map<string, string> = new Map();
  private _delegate: Storage | null = null;

  constructor() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        // Test write to verify it actually works (Safari private mode throws here)
        const testKey = "__safari_test__";
        window.localStorage.setItem(testKey, "1");
        window.localStorage.removeItem(testKey);
        this._delegate = window.localStorage;
      }
    } catch {
      // localStorage not available — use in-memory fallback
      this._delegate = null;
    }
  }

  get length(): number {
    if (this._delegate) return this._delegate.length;
    return this._store.size;
  }

  clear(): void {
    if (this._delegate) {
      try { this._delegate.clear(); } catch { this._store.clear(); }
    } else {
      this._store.clear();
    }
  }

  getItem(key: string): string | null {
    if (this._delegate) {
      try { return this._delegate.getItem(key); } catch { return this._store.get(key) ?? null; }
    }
    return this._store.get(key) ?? null;
  }

  key(index: number): string | null {
    if (this._delegate) {
      try { return this._delegate.key(index); } catch { /* fall through */ }
    }
    const keys = Array.from(this._store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    if (this._delegate) {
      try { this._delegate.removeItem(key); return; } catch { /* fall through */ }
    }
    this._store.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this._delegate) {
      try { this._delegate.setItem(key, value); return; } catch { /* fall through */ }
    }
    this._store.set(key, value);
  }
}

/** A singleton storage instance safe for all browsers including Safari Private Mode */
export const safeStorage = new SafeStorage();
