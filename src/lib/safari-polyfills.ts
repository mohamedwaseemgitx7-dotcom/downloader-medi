/**
 * Safari polyfills — imported at the top of the app entry.
 *
 * These cover APIs that Safari 12–14 lack or partially support.
 * Each polyfill is guarded so it's a no-op on modern browsers.
 */

// globalThis (Safari < 12.1)
if (typeof globalThis === "undefined") {
  (function () {
    // @ts-expect-error polyfill
    if (typeof self !== "undefined") { self.globalThis = self; }
    // @ts-expect-error polyfill
    else if (typeof window !== "undefined") { window.globalThis = window; }
    // @ts-expect-error polyfill
    else if (typeof global !== "undefined") { global.globalThis = global; }
  })();
}

// Array.prototype.flat / flatMap (Safari < 12)
if (!Array.prototype.flat) {
  // @ts-expect-error polyfill
  Array.prototype.flat = function (depth = 1) {
    const flatten = (arr: any[], d: number): any[] =>
      d > 0
        ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val), [])
        : arr.slice();
    return flatten(this, depth);
  };
}

if (!Array.prototype.flatMap) {
  // @ts-expect-error polyfill
  Array.prototype.flatMap = function (callback: any, thisArg?: any) {
    // @ts-expect-error polyfill
    return this.map(callback, thisArg).flat();
  };
}

// Object.fromEntries (Safari < 12.1)
if (!Object.fromEntries) {
  // @ts-expect-error polyfill
  Object.fromEntries = function (entries: Iterable<[string, any]>) {
    const obj: Record<string, any> = {};
    for (const [key, value] of entries) {
      obj[key] = value;
    }
    return obj;
  };
}

// String.prototype.replaceAll (Safari < 13.1)
if (!String.prototype.replaceAll) {
  // @ts-expect-error polyfill
  String.prototype.replaceAll = function (search: string | RegExp, replacement: string) {
    if (search instanceof RegExp) {
      if (!search.global) throw new TypeError("replaceAll must be called with a global RegExp");
      return this.replace(search, replacement);
    }
    return this.split(search).join(replacement);
  };
}

// Promise.allSettled (Safari < 13)
if (!Promise.allSettled) {
  // @ts-expect-error polyfill
  Promise.allSettled = function (promises: Iterable<Promise<any>>) {
    return Promise.all(
      Array.from(promises).map((p) =>
        Promise.resolve(p).then(
          (value) => ({ status: "fulfilled" as const, value }),
          (reason) => ({ status: "rejected" as const, reason }),
        ),
      ),
    );
  };
}

// queueMicrotask (Safari < 12.1)
if (typeof queueMicrotask !== "function") {
  // @ts-expect-error polyfill
  globalThis.queueMicrotask = (callback: VoidFunction) => {
    Promise.resolve().then(callback).catch((e) => {
      setTimeout(() => { throw e; });
    });
  };
}

export {};
