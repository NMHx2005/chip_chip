/**
 * The states a comment can be in, mirroring the `comment_status` enum.
 *
 * A reader's comment starts `pending` and is invisible until a moderator
 * approves it; `hidden` is how a moderator takes an approved comment back down.
 * A staff reply skips the queue (see /api/comments).
 */
export const COMMENT_STATUSES = ["pending", "approved", "hidden"] as const;

export type CommentStatus = (typeof COMMENT_STATUSES)[number];

export function isCommentStatus(value: string): value is CommentStatus {
  return (COMMENT_STATUSES as readonly string[]).includes(value);
}
