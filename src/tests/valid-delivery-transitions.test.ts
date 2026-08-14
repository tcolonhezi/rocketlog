import { isValidStatusTransition } from "@/util/delivery-transitions.js";
import { describe, expect, it } from "@jest/globals";

describe("isValidStatusTransition", () => {
  it("should allow PENDING to IN_TRANSIT", () => {
    expect(isValidStatusTransition("PENDING", "IN_TRANSIT")).toBe(true);
  });
  it("should allow IN_TRANSIT to DELIVERED", () => {
    expect(isValidStatusTransition("IN_TRANSIT", "DELIVERED")).toBe(true);
  });
  it("should NOT allow IN_TRANSIT to PENDING", () => {
    expect(isValidStatusTransition("IN_TRANSIT", "PENDING")).not.toBe(true);
  });
  it("should NOT allow PENDING to DELIVERED", () => {
    expect(isValidStatusTransition("PENDING", "DELIVERED")).not.toBe(true);
  });
  it("should NOT allow DELIVERED to IN_TRANSIT", () => {
    expect(isValidStatusTransition("DELIVERED", "IN_TRANSIT")).not.toBe(true);
  });
  it("should NOT allow IN_TRANSIT to PENDING", () => {
    expect(isValidStatusTransition("IN_TRANSIT", "PENDING")).toBe(false);
  });
});
