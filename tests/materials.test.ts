import { describe, expect, it } from "vitest";
import { dollarsToCents, formatCents, lineTotalCents, materialsTotalCents } from "@/lib/materials";

describe("materials totals", () => {
  it("sums quantity times unit cost in integer cents", () => {
    expect(
      materialsTotalCents([
        { name: "Canvas", quantity: 1, unitCostCents: 8900 },
        { name: "Paint", quantity: 6, unitCostCents: 1450 },
      ]),
    ).toBe(8900 + 6 * 1450);
  });

  it("returns 0 for an empty list", () => {
    expect(materialsTotalCents([])).toBe(0);
  });

  it("ignores negative, NaN, or missing values", () => {
    expect(materialsTotalCents([{ name: "x", quantity: -2, unitCostCents: 500 }])).toBe(0);
    expect(materialsTotalCents([{ name: "x", quantity: NaN, unitCostCents: 500 }])).toBe(0);
    expect(materialsTotalCents([{ name: "x", quantity: 2, unitCostCents: NaN }])).toBe(0);
  });

  it("rounds fractional quantities to whole cents", () => {
    expect(lineTotalCents({ name: "Fabric (yards)", quantity: 1.5, unitCostCents: 333 })).toBe(500);
  });

  it("formats cents as dollars", () => {
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(NaN)).toBe("$0.00");
  });

  it("parses dollar strings into cents", () => {
    expect(dollarsToCents("12.5")).toBe(1250);
    expect(dollarsToCents("$1,200")).toBe(120000);
    expect(dollarsToCents("")).toBe(0);
    expect(dollarsToCents("abc")).toBe(0);
  });
});
