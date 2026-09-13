import { describe, expect, it } from "vitest";
import { fillProgress } from "@/components/motion/fillProgress";

const VH = 1000;

describe("fillProgress", () => {
  it("bằng 0 khi mục tiêu còn ở dưới đáy khung nhìn", () => {
    expect(fillProgress(VH, VH)).toBe(0);
    expect(fillProgress(VH * 2, VH)).toBe(0);
  });

  it("bằng 1 khi mục tiêu đã lên tới 30% chiều cao khung nhìn", () => {
    expect(fillProgress(VH * 0.3, VH)).toBe(1);
  });

  it("tiếp tục kẹp ở 1 khi mục tiêu cuộn lên cao hơn nữa", () => {
    expect(fillProgress(0, VH)).toBe(1);
    expect(fillProgress(-500, VH)).toBe(1);
  });

  it("đi qua 0.5 ở đúng giữa quãng", () => {
    expect(fillProgress(VH * 0.65, VH)).toBeCloseTo(0.5, 5);
  });

  it("tăng đơn điệu khi mục tiêu đi lên", () => {
    const seq = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3].map((f) =>
      fillProgress(VH * f, VH)
    );
    for (let i = 1; i < seq.length; i += 1) {
      expect(seq[i]).toBeGreaterThan(seq[i - 1]);
    }
  });

  it("trả 0 thay vì chia cho 0 khi khung nhìn cao 0", () => {
    expect(fillProgress(0, 0)).toBe(0);
  });
});
