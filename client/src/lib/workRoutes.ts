import { projects, type Project } from "@/content/projects";

export type PublicWorkRouteRecord = {
  id: number;
  slug: string;
  title: string;
  year: string;
  kind: string;
  description: string;
  longDescription: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  ogImageUrl: string | null;
  role: string;
  timeline: string;
  stack: string;
  principle: string;
  problem: string;
  outcome: string;
  liveUrl: string | null;
  repository: string | null;
  grid: "feature" | "side" | "small";
};

export function getProjectSlug(project: Pick<Project, "id" | "slug">) {
  return project.slug ?? project.id;
}

export function findStaticProjectBySlug(slug: string) {
  return projects.find((project) => getProjectSlug(project) === slug);
}

export function toProjectFromPublicWork(work: PublicWorkRouteRecord): Project {
  return {
    id: `work-${work.id}`,
    slug: work.slug,
    title: work.title,
    year: work.year,
    kind: work.kind,
    description: work.description,
    longDescription: work.longDescription,
    image: work.imageUrl ?? undefined,
    thumbnailUrl: work.thumbnailUrl ?? undefined,
    ogImageUrl: work.ogImageUrl ?? undefined,
    role: work.role,
    timeline: work.timeline,
    stack: work.stack,
    principle: work.principle,
    problem: work.problem,
    outcome: work.outcome,
    visual: work.imageUrl ? "image" : "studio",
    grid: work.grid,
    liveUrl: work.liveUrl ?? undefined,
    repository: work.repository ?? undefined,
  };
}
