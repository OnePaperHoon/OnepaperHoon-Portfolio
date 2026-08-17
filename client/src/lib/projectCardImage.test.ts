import { describe, expect, it } from "vitest";
import { getProjectCardImage, hasProjectCardImage } from "./projectCardImage";

describe("getProjectCardImage", () => {
  it("uses the generated thumbnail before the original cover on project cards", () => {
    expect(getProjectCardImage({
      image: "/manus-storage/works/1/covers/source.png",
      thumbnailUrl: "/manus-storage/works/1/thumbnails/card.webp",
    })).toBe("/manus-storage/works/1/thumbnails/card.webp");
  });

  it("falls back to the original cover when a card thumbnail is unavailable", () => {
    expect(getProjectCardImage({ image: "/manus-storage/works/1/covers/source.png", thumbnailUrl: "  " }))
      .toBe("/manus-storage/works/1/covers/source.png");
  });

  it("identifies whether a card needs an image loading state", () => {
    expect(hasProjectCardImage({ thumbnailUrl: "/manus-storage/works/1/thumbnails/card.webp" })).toBe(true);
    expect(hasProjectCardImage({ thumbnailUrl: "  ", image: undefined })).toBe(false);
  });
});
