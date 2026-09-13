import { describe, expect, it } from "vitest";
import {
  HOLD,
  holdReducer,
  initialHoldState,
  type HoldState,
} from "@/components/motion/holdToReveal";

const down = (x = 0, y = 0) => ({ type: "down", x, y }) as const;

describe("holdReducer", () => {
  it("hiện nội dung ngay khi chạm xuống", () => {
    const { state, startHoldTimer } = holdReducer(initialHoldState, down());
    expect(state.revealed).toBe(true);
    expect(state.pointerDown).toBe(true);
    expect(startHoldTimer).toBe(true);
  });

  it("chỉ tính là giữ khi hết bộ đếm mà chưa di chuyển", () => {
    const a = holdReducer(initialHoldState, down()).state;
    const b = holdReducer(a, { type: "holdTimer" }).state;
    expect(b.holding).toBe(true);
  });

  it("không tính là giữ nếu đã vuốt trước khi hết bộ đếm", () => {
    const a = holdReducer(initialHoldState, down()).state;
    const b = holdReducer(a, { type: "move", x: 20, y: 0 }).state;
    const c = holdReducer(b, { type: "holdTimer" }).state;
    expect(c.holding).toBe(false);
  });

  it("coi dịch chuyển quá ngưỡng là vuốt để cuộn", () => {
    const a = holdReducer(initialHoldState, down()).state;
    const { state, hideAfterMs } = holdReducer(a, {
      type: "move",
      x: HOLD.moveThresholdPx + 1,
      y: 0,
    });
    expect(state.moved).toBe(true);
    expect(state.holding).toBe(false);
    expect(hideAfterMs).toBe(HOLD.hideAfterTapMs);
  });

  it("bỏ qua dịch chuyển nhỏ hơn ngưỡng", () => {
    const a = holdReducer(initialHoldState, down()).state;
    const { state } = holdReducer(a, { type: "move", x: 5, y: 5 });
    expect(state.moved).toBe(false);
  });

  it("nhả sau khi giữ thì ẩn nhanh", () => {
    let s: HoldState = holdReducer(initialHoldState, down()).state;
    s = holdReducer(s, { type: "holdTimer" }).state;
    expect(holdReducer(s, { type: "up" }).hideAfterMs).toBe(HOLD.hideAfterHoldMs);
  });

  it("chạm nhanh rồi nhả thì để lâu hơn cho người đọc kịp nhìn", () => {
    const s = holdReducer(initialHoldState, down()).state;
    expect(holdReducer(s, { type: "up" }).hideAfterMs).toBe(HOLD.hideAfterTapMs);
  });

  it("di chuột khi không nhấn thì hẹn ẩn", () => {
    const { hideAfterMs } = holdReducer(initialHoldState, {
      type: "move",
      x: 0,
      y: 0,
    });
    expect(hideAfterMs).toBe(HOLD.hideAfterTapMs);
  });

  it("sự kiện hide tắt hiển thị và đặt lại mọi cờ", () => {
    const s = holdReducer(initialHoldState, down()).state;
    const { state } = holdReducer(s, { type: "hide" });
    expect(state).toEqual(initialHoldState);
  });
});
