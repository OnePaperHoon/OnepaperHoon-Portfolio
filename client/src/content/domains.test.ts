import { describe, expect, it } from "vitest";
import { domainServices } from "./domains";

describe("domainServices", () => {
  it("lists each requested service domain exactly once", () => {
    expect(domainServices.map((service) => service.domain)).toEqual([
      "feedline.kr",
      "rouletteside.com",
      "psychicdollop.com",
    ]);
  });

  it("uses valid external HTTPS links and the intended lifecycle states", () => {
    expect(domainServices.map((service) => service.state)).toEqual(["live", "live", "planned"]);
    domainServices.forEach((service) => expect(new URL(service.href).protocol).toBe("https:"));
  });
});
