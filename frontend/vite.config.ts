import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/ImprovMate/",
  server: {
    port: 3000, // Default port
    strictPort: true, // Don't allow a different port than the one specified
    host: true, // Allow external access to the server
  },
});