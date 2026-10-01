import { describe, expect, it } from "vitest";
import { fieldForError, validateMessageFields } from "@/components/contact/message-form-fields";

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

describe("validateMessageFields", () => {
  const valid = { name: "Minh Anh", email: "minhanh@example.com", body: "Xin chào" };

  it("returns nothing when every field is valid", () => {
    expect(validateMessageFields(valid)).toEqual({});
  });

  it("reports every failing field at once", () => {
    expect(validateMessageFields({ name: "", email: "", body: "" })).toEqual({
      name: "nameLength",
      body: "bodyLength",
    });
  });

  it("allows a blank email", () => {
    expect(validateMessageFields({ ...valid, email: "" })).toEqual({});
  });

  it("flags an invalid email", () => {
    expect(validateMessageFields({ ...valid, email: "minhanh@" })).toEqual({
      email: "emailInvalid",
    });
  });

  it("flags values over the limit", () => {
    expect(validateMessageFields({ ...valid, name: "a".repeat(81) })).toEqual({ name: "nameLength" });
    expect(validateMessageFields({ ...valid, body: "a".repeat(4001) })).toEqual({
      body: "bodyLength",
    });
  });

  it("trims before checking", () => {
    expect(validateMessageFields({ ...valid, name: "   " })).toEqual({ name: "nameLength" });
  });
});
