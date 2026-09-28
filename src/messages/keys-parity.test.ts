import { describe, expect, it } from "vitest";
import vi from "@/messages/vi.json";
import en from "@/messages/en.json";

function keys(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node).flatMap(([key, value]) =>
    keys(value, prefix ? `${prefix}.${key}` : key)
  );
}

/** A key present in one locale only renders as its raw path in the other. */
describe("message catalogues", () => {
  it("have exactly the same keys in Vietnamese and English", () => {
    expect(keys(en).sort()).toEqual(keys(vi).sort());
  });
});
