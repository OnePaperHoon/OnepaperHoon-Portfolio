import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..", "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("public Work detail route", () => {
  it("registers a lazy /work/:slug route before the application fallback", () => {
    const app = readProjectFile("client/src/App.tsx");
    expect(app).toContain('const WorkDetail = lazy(() => import("./pages/WorkDetail"))');
    expect(app).toContain('<Route path="/work/:slug" component={WorkDetail} />');
  });

  it("resolves works statically and keeps standalone canonical URL metadata", () => {
    const page = readProjectFile("client/src/pages/WorkDetail.tsx");
    expect(page).toContain("findStaticProjectBySlug(slug)");
    expect(page).toContain("https://onepaperhoon.com/work/${slug}");
    expect(page).toContain('updateCanonical(url)');
    expect(page).toContain('updateMeta("property", "og:image", socialImage)');
    expect(page).toContain('updateMeta("name", "twitter:image", socialImage)');
    expect(page).toContain("project.ogImageUrl ?? image");
  });

  it("moves legacy query-string links onto the stable public Work URL", () => {
    const home = readProjectFile("client/src/pages/Home.tsx");
    expect(home).toContain('window.location.replace(`/work/${getProjectSlug(linkedProject)}`)');
    expect(home).toContain('window.location.assign(`/work/${getProjectSlug(project)}`)');
  });

  it("renders previous and next public Work links using independent paths", () => {
    const page = readProjectFile("client/src/pages/WorkDetail.tsx");
    expect(page).toContain("getAdjacentWorks(projectItems, slug)");
    expect(page).toContain("t.detailPrevWork");
    expect(page).toContain("t.detailNextWork");
    expect(page).toContain("work-pagination");
  });
});
