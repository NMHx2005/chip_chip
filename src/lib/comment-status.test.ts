import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COMMENT_STATUSES, isCommentStatus } from "@/lib/comment-status";

describe("comment statuses", () => {
  it("lists each state once", () => {
    expect(COMMENT_STATUSES).toHaveLength(3);
    expect(new Set(COMMENT_STATUSES).size).toBe(3);
  });

  it("matches the enum the database actually created, in both directions", () => {
    // The two have to agree: a status the app writes but Postgres does not know
    // fails only when a moderator clicks it, and a status Postgres has but the
    // app does not would be unreachable from the queue. Both directions are
    // asserted, so neither can drift unnoticed.
    const sql = readFileSync(
      "supabase/migrations/20261002000100_comment_status_enum.sql",
      "utf8"
    );
    const created = sql.match(/create type public\.comment_status as enum \(([^)]*)\)/);
    expect(created).not.toBeNull();

    const values = [...(created?.[1] ?? "").matchAll(/'([a-z]+)'/g)]
      .map((match) => match[1])
      .sort();
    expect(values).toEqual([...COMMENT_STATUSES].sort());
  });

  it("recognises only known statuses", () => {
    expect(isCommentStatus("approved")).toBe(true);
    expect(isCommentStatus("deleted")).toBe(false);
    expect(isCommentStatus("")).toBe(false);
  });
});
