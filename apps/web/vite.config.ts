import { defineConfig } from "vite";

// Só usado em `pnpm --filter @elias/web dev` (iteração de UI). O fluxo
// principal do usuário é `pnpm app`: build + apps/api servindo os estáticos
// na mesma origem, sem precisar de proxy.
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://127.0.0.1:4787",
    },
  },
});
