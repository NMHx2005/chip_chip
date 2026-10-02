import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMMENT_STATUSES, isCommentStatus } from "@/lib/comment-status";

describe("comment statuses", () => {
  it("lists each state once", () => {
    expect(COMMENT_STATUSES).toHaveLength(3);
    expect(new Set(COMMENT_STATUSES).size).toBe(3);
  });

  it("matches the enum the database actually created", () => {
    // The two have to agree: a status the app writes but Postgres does not know
    // fails only at the moment a moderator clicks it.
    const sql = readFileSync(
      "supabase/migrations/20261002000100_comment_status_enum.sql",
      "utf8"
    );
    for (const status of COMMENT_STATUSES) {
      expect(sql).toContain(`'${status}'`);
    }
  });

  it("recognises only known statuses", () => {
    expect(isCommentStatus("approved")).toBe(true);
    expect(isCommentStatus("deleted")).toBe(false);
    expect(isCommentStatus("")).toBe(false);
  });
});
