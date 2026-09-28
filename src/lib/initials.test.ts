import { describe, expect, it } from "vitest";
import { initials } from "@/lib/initials";

describe("initials", () => {
  it("takes the first and last word of a Vietnamese name", () => {
    expect(initials("Nguyễn Văn An")).toBe("NA");
    expect(initials("Đặng Ánh")).toBe("ĐÁ");
  });

  it("keeps accents written as combining marks", () => {
    expect(initials("Ánh")).toBe("Á");
  });

  it("uses one letter for a single word", () => {
    expect(initials("lan")).toBe("L");
  });

  it("skips brackets, digits and extra spaces in the placeholder", () => {
    expect(initials("  [Tên tác giả]  ")).toBe("TG");
    expect(initials("[Author name]")).toBe("AN");
  });

  it("falls back to a question mark when there is no letter", () => {
    expect(initials("")).toBe("?");
    expect(initials("[ 123 ]")).toBe("?");
  });
});
