import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  define: {
    "process.env": {},
    global: "globalThis",
  },
  build: {
    target: ["es2015", "safari12"],
    cssTarget: ["safari12", "ios_saf 12"],
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
