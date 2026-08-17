import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..", "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("Signal Field 404 recovery route", () => {
  it("uses the custom NotFound screen as the final application route", () => {
    const app = readProjectFile("client/src/App.tsx");
    expect(app).toContain('import NotFound from "./pages/NotFound"');
    expect(app).toContain("<Route component={NotFound} />");
    expect(app).not.toContain("<Route component={Home} />");
  });

  it("offers the current unknown route and two non-destructive recovery paths", () => {
    const page = readProjectFile("client/src/pages/NotFound.tsx");
    expect(page).toContain("const [location] = useLocation()");
    expect(page).toContain("<code>{location}</code>");
    expect(page).toContain('href="/"');
    expect(page).toContain('href="/#work"');
  });
});
