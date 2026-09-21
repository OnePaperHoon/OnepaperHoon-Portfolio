import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://onepaperhoon.com",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: { theme: "github-dark-dimmed" },
  },
});
