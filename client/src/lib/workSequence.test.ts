import { describe, expect, it } from "vitest";
import type { Project } from "@/content/projects";
import { getAdjacentWorks } from "./workSequence";

const project = (id: string): Project => ({ id, title: id, year: "2026", kind: "Tool", description: "A public Work summary.", longDescription: "A longer public Work description for testing.", role: "Design", timeline: "2026", stack: "TypeScript", principle: "Make each path explicit.", problem: "Readers need a route.", outcome: "Readers can continue exploring.", visual: "studio", grid: "small" });

describe("adjacent public Work navigation", () => {
  it("returns circular previous and next work by stable slug", () => {
    const works = [project("alpha"), project("beta"), project("gamma")];
    expect(getAdjacentWorks(works, "alpha")).toMatchObject({ previous: { id: "gamma" }, next: { id: "beta" } });
  });

  it("removes duplicate slugs and hides navigation when only one work exists", () => {
    const alpha = project("alpha");
    expect(getAdjacentWorks([alpha, { ...alpha, title: "Latest alpha" }], "alpha")).toBeNull();
  });
});
