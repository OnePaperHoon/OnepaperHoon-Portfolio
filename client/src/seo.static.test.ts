import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..", "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("Search Console static SEO assets", () => {
  it("publishes only the canonical public portfolio URL in the root sitemap", () => {
    const sitemap = readProjectFile("client/public/sitemap.xml");
    expect(sitemap).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    expect(sitemap).toContain("<loc>https://onepaperhoon.com/</loc>");
    expect(sitemap).toContain("<loc>https://onepaperhoon.com/work/feedline</loc>");
    expect(sitemap).toContain("<loc>https://onepaperhoon.com/work/codex-alert</loc>");
    expect(sitemap).not.toContain("/studio");
  });

  it("advertises the sitemap in robots.txt", () => {
    const robots = readProjectFile("client/public/robots.txt");
    expect(robots).toContain("Sitemap: https://onepaperhoon.com/sitemap.xml");
  });

  it("keeps a build-time Google Search Console verification slot in the document head", () => {
    const document = readProjectFile("client/index.html");
    expect(document).toContain('<meta name="google-site-verification" content="%VITE_GOOGLE_SITE_VERIFICATION%" />');
  });

  it("receives a non-empty Search Console verification token at build time", () => {
    expect(process.env.VITE_GOOGLE_SITE_VERIFICATION?.trim()).toBeTruthy();
  });
});
