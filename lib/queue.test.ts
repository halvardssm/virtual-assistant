import { describe, test, expect, jest } from "@jest/globals";
import { Queue } from "./queue";

describe("Queue test", () => {
  test("constructor", () => {
    const c = new Queue(() => {});
    expect(c).toBeInstanceOf(Queue);
    expect(c).toHaveProperty("_queue", []);
    expect(c).toHaveProperty("_onEmptyCallback");
    expect(c).toHaveProperty("_active", false);
  });
  test("add", () => {
    const c = new Queue(() => {});
    const func = jest.fn();
    c.add(func);
    expect(func).toHaveBeenCalledTimes(1);
    expect(c).toHaveProperty("_queue", []);
  });
  // TODO test clear & next
});
