import { describe, expect, it } from "vitest";
import {
  commentInitial,
  firstInvalidField,
  freshCommentIds,
  validateComment,
} from "@/lib/comment-form";

const ok = { name: "An", email: "an@example.com", body: "Hello" };

describe("validateComment", () => {
  it("accepts a complete comment", () => {
    expect(validateComment(ok)).toEqual({});
  });

  it("accepts an empty email, it is optional", () => {
    expect(validateComment({ ...ok, email: "" })).toEqual({});
  });

  it("treats whitespace-only fields as empty", () => {
    expect(validateComment({ name: "  ", email: "", body: "\n " })).toEqual({
      name: "nameRequired",
      body: "bodyRequired",
    });
  });

  it("rejects a malformed email", () => {
    expect(validateComment({ ...ok, email: "an@" })).toEqual({ email: "emailInvalid" });
  });

  it("reports every invalid field at once", () => {
    expect(validateComment({ name: "", email: "x", body: "" })).toEqual({
      name: "nameRequired",
      email: "emailInvalid",
      body: "bodyRequired",
    });
  });

  it("allows exactly 2000 characters and rejects 2001 (after trimming)", () => {
    expect(validateComment({ ...ok, body: "a".repeat(2000) })).toEqual({});
    expect(validateComment({ ...ok, body: `  ${"a".repeat(2000)}  ` })).toEqual({});
    expect(validateComment({ ...ok, body: "a".repeat(2001) })).toEqual({ body: "bodyTooLong" });
  });
});

describe("firstInvalidField", () => {
  it("returns null when nothing is wrong", () => {
    expect(firstInvalidField({})).toBeNull();
  });

  it("follows the visual order name, email, body", () => {
    expect(firstInvalidField({ body: "bodyRequired", email: "emailInvalid" })).toBe("email");
    expect(firstInvalidField({ body: "bodyRequired" })).toBe("body");
    expect(firstInvalidField({ name: "nameRequired", body: "bodyRequired" })).toBe("name");
  });
});

describe("commentInitial", () => {
  it("upper-cases the first letter, ignoring leading spaces", () => {
    expect(commentInitial("  ánh")).toBe("Á");
  });

  it("keeps a whole emoji as one character", () => {
    expect(commentInitial("🙂 An")).toBe("🙂");
  });

  it("falls back to a question mark for an empty name", () => {
    expect(commentInitial("   ")).toBe("?");
  });
});

describe("freshCommentIds", () => {
  it("is empty before anything has been rendered so the initial list does not animate", () => {
    expect(freshCommentIds(null, ["a", "b"])).toEqual([]);
  });

  it("counts every id as new after a render that showed no comments", () => {
    expect(freshCommentIds(new Set(), ["a"])).toEqual(["a"]);
  });

  it("returns only the ids that were not there before, in order", () => {
    expect(freshCommentIds(new Set(["a", "b"]), ["c", "a", "d", "b"])).toEqual(["c", "d"]);
  });

  it("is empty when nothing arrived", () => {
    expect(freshCommentIds(new Set(["a"]), ["a"])).toEqual([]);
  });
});
