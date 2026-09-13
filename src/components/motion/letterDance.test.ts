import { describe, expect, it } from "vitest";
import { buildLetterMeta, pseudoRand } from "@/components/motion/letterDance";

describe("pseudoRand", () => {
  it("luôn trả về cùng giá trị cho cùng hạt giống", () => {
    expect(pseudoRand(7)).toBe(pseudoRand(7));
  });

  it("nằm trong khoảng [0, 1)", () => {
    for (let i = 0; i < 100; i += 1) {
      const v = pseudoRand(i);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("cho giá trị khác nhau với hạt giống khác nhau", () => {
    expect(pseudoRand(1)).not.toBe(pseudoRand(2));
  });
});

describe("buildLetterMeta", () => {
  it("trả về đúng một mục cho mỗi ký tự", () => {
    expect(buildLetterMeta("Tham gia")).toHaveLength(8);
  });

  it("để dấu cách đứng yên", () => {
    const meta = buildLetterMeta("a b");
    expect(meta[1]).toEqual({ y: 0, scale: 1, rotate: 0, opacity: 1, delay: 0 });
  });

  it("giữ mọi thông số trong biên đã định", () => {
    for (const m of buildLetterMeta("Tìm hiểu ngay")) {
      expect(m.y).toBeGreaterThanOrEqual(-4);
      expect(m.y).toBeLessThanOrEqual(0);
      expect(m.scale).toBeGreaterThanOrEqual(1);
      expect(m.scale).toBeLessThanOrEqual(1.45);
      expect(Math.abs(m.rotate)).toBeLessThanOrEqual(12);
      expect(m.opacity).toBeGreaterThanOrEqual(0.7);
      expect(m.opacity).toBeLessThanOrEqual(1);
      expect(m.delay).toBeGreaterThanOrEqual(0);
      expect(m.delay).toBeLessThanOrEqual(0.08);
    }
  });

  it("cho kết quả giống hệt nhau giữa các lần gọi", () => {
    expect(buildLetterMeta("Chíp Chíp")).toEqual(buildLetterMeta("Chíp Chíp"));
  });
});
