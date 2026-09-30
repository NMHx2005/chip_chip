import { describe, expect, it } from "vitest";
import { pickActiveHeading } from "@/lib/toc";

const tops = [
  { id: "a", top: 100 },
  { id: "b", top: 600 },
  { id: "c", top: 1200 },
];

describe("pickActiveHeading", () => {
  it("returns null for an empty list", () => {
    expect(pickActiveHeading([], 120)).toBeNull();
  });

  it("returns the first heading while the reader is still above it", () => {
    expect(pickActiveHeading(tops, -500)).toBe("a");
  });

  it("returns the last heading that has reached the offset", () => {
    expect(pickActiveHeading(tops, 700)).toBe("b");
  });

  it("counts a heading exactly at the offset as reached", () => {
    expect(pickActiveHeading(tops, 600)).toBe("b");
  });

  it("stays on the last heading once the reader is past it", () => {
    expect(pickActiveHeading(tops, 9000)).toBe("c");
  });

  it("does not depend on the order of the input", () => {
    expect(pickActiveHeading([tops[2], tops[0], tops[1]], 700)).toBe("b");
  });
});
