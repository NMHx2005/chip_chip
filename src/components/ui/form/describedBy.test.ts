import { describe, expect, it } from "vitest";
import { describedBy } from "@/components/ui/form/describedBy";

describe("describedBy", () => {
  it("joins the ids that exist, hint first", () => {
    expect(describedBy({ hint: "h", error: "e" })).toBe("h e");
  });

  it("skips missing ids", () => {
    expect(describedBy({ error: "e" })).toBe("e");
    expect(describedBy({ hint: "h" })).toBe("h");
  });

  it("returns undefined when there is nothing to describe", () => {
    expect(describedBy({})).toBeUndefined();
  });
});
