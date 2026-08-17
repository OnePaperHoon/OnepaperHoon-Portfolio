import { describe, expect, it } from "vitest";
import { findStaticProjectBySlug, getProjectSlug, toProjectFromPublicWork } from "./workRoutes";

describe("public Work routes", () => {
  it("uses the explicit slug when available and the static project id as a stable fallback", () => {
    expect(getProjectSlug({ id: "feedline" })).toBe("feedline");
    expect(getProjectSlug({ id: "work-1", slug: "signal-field" })).toBe("signal-field");
    expect(findStaticProjectBySlug("feedline")?.title).toBe("FeedLine");
  });

  it("maps a published Studio Work into the same public project shape", () => {
    const project = toProjectFromPublicWork({
      id: 7, slug: "live-signal", title: "Live signal", year: "2026", kind: "Tool", description: "A concise public description.", longDescription: "A longer public description for this published case study.", imageUrl: "/manus-storage/cover.png", thumbnailUrl: "/manus-storage/thumb.webp", ogImageUrl: "/manus-storage/share.png", role: "Design", timeline: "2026", stack: "TypeScript", principle: "Keep the next action explicit.", problem: "Signals need a calm home.", outcome: "The work is easy to share.", liveUrl: "https://example.com", repository: "https://github.com/example/repo", grid: "feature",
    });
    expect(project).toMatchObject({ id: "work-7", slug: "live-signal", visual: "image", thumbnailUrl: "/manus-storage/thumb.webp", ogImageUrl: "/manus-storage/share.png" });
  });
});
