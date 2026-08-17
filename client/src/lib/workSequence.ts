import type { Project } from "@/content/projects";
import { getProjectSlug } from "./workRoutes";

export function getAdjacentWorks(projects: Project[], currentSlug: string) {
  const uniqueProjects = Array.from(new Map(projects.map((project) => [getProjectSlug(project), project])).values());
  const currentIndex = uniqueProjects.findIndex((project) => getProjectSlug(project) === currentSlug);
  if (currentIndex < 0 || uniqueProjects.length < 2) return null;
  return {
    previous: uniqueProjects[(currentIndex - 1 + uniqueProjects.length) % uniqueProjects.length],
    next: uniqueProjects[(currentIndex + 1) % uniqueProjects.length],
  };
}
