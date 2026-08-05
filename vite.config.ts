import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  define: {
    "process.env": {},
    global: "globalThis",
  },
  build: {
    target: "es2020",
    cssTarget: "safari14",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
