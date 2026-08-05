import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  define: {
    "process.env": {},
    global: "globalThis",
  },
  build: {
    // Safari 14 = iOS 14 (2020). Covers ~99% of active iPhones.
    // es2020 syntax is fully supported by Safari 14+.
    target: ["es2020", "safari14"],
    cssTarget: ["safari14", "ios_saf14"],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
