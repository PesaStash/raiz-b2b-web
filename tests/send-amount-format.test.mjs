import test from "node:test";
import assert from "node:assert/strict";
import { formatTypedAmount } from "../src/utils/formatTypedAmount.ts";

test("typing amounts groups thousands without rounding or losing decimal entry", () => {
  for (const [input, expected] of [
    ["", ""],
    ["1", "1"],
    ["1000", "1,000"],
    ["1000000.50", "1,000,000.50"],
    ["1000.", "1,000."],
    ["1000.0", "1,000.0"],
    [".5", ".5"],
    ["9007199254740993.01", "9,007,199,254,740,993.01"],
  ]) {
    assert.equal(formatTypedAmount(input), expected);
    assert.equal(formatTypedAmount(input).replace(/,/g, ""), input);
  }
});
