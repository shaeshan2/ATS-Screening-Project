import { describe, expect, it } from "vitest";
import { isApplicationId } from "./application-id";

describe("isApplicationId", () => {
  it("accepts a canonical application UUID", () => {
    expect(isApplicationId("3f1a0c2e-6b7d-4e8a-9c1d-2b3a4c5d6e7f")).toBe(true);
    expect(isApplicationId("3F1A0C2E-6B7D-4E8A-9C1D-2B3A4C5D6E7F")).toBe(true);
  });

  it("rejects missing, malformed, and non-UUID identifiers", () => {
    expect(isApplicationId("")).toBe(false);
    expect(isApplicationId("not-a-uuid")).toBe(false);
    expect(isApplicationId("3f1a0c2e6b7d4e8a9c1d2b3a4c5d6e7f")).toBe(false);
    expect(isApplicationId("3f1a0c2e-6b7d-4e8a-9c1d-2b3a4c5d6e7f-extra")).toBe(
      false,
    );
    expect(isApplicationId("app_01")).toBe(false);
  });
});
