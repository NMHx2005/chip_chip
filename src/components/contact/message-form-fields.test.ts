import { describe, expect, it } from "vitest";
import { fieldForError } from "@/components/contact/message-form-fields";

describe("fieldForError", () => {
  it.each([
    ["nameLength", "name"],
    ["emailInvalid", "email"],
    ["bodyLength", "body"],
  ] as const)("maps %s to the %s field", (error, field) => {
    expect(fieldForError(error)).toBe(field);
  });

  it.each(["postNotFound", "rateLimited", "network", "generic"] as const)(
    "has no field for the server-only error %s",
    (error) => {
      expect(fieldForError(error)).toBeNull();
    }
  );
});
