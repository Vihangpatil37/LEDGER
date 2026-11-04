import { describe, expect, it } from "vitest";
import { handleServerError, isAppErrorCode } from "@/lib/server/errors";
import { AppAuthError } from "@/lib/server/auth";

describe("Server Errors Module", () => {
  it("recognizes valid AppErrorCodes", () => {
    expect(isAppErrorCode("UNAUTHENTICATED")).toBe(true);
    expect(isAppErrorCode("VALIDATION_FAILED")).toBe(true);
    expect(isAppErrorCode("AMOUNT_OUT_OF_RANGE")).toBe(true);
    expect(isAppErrorCode("ADVANCE_CONFIRMATION_REQUIRED")).toBe(true);
    expect(isAppErrorCode("SOME_RANDOM_ERROR")).toBe(false);
  });

  it("handles AppAuthError as UNAUTHENTICATED", () => {
    const error = new AppAuthError();
    const result = handleServerError(error);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHENTICATED");
    }
  });

  it("maps PostgREST error with known message and JSON details", () => {
    const pgError = {
      message: "ADVANCE_CONFIRMATION_REQUIRED",
      details: JSON.stringify({ balance: "200.00", amount: "500.00" }),
    };

    const result = handleServerError(pgError);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ADVANCE_CONFIRMATION_REQUIRED");
      expect(result.error.details).toEqual({
        balance: "200.00",
        amount: "500.00",
      });
    }
  });

  it("maps unknown error to INTERNAL", () => {
    const unknownError = new Error("Database connection lost at 192.168.1.1");
    const result = handleServerError(unknownError);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL");
      expect(result.error.message).toBe("Could not save. Nothing was changed. Try again.");
    }
  });
});
