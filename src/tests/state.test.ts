import { describe, expect, it, vi } from "vitest";
import { state } from "../state";

describe("state function", () => {
  it("creates a state container with initial value", () => {
    const count = state(0);
    expect(count.value).toBe(0);
  });

  it("updates state value", () => {
    const count = state(0);
    count.value = 1;
    expect(count.value).toBe(1);
  });

  it("notifies observers when value changes", () => {
    const count = state(0);
    const observer = vi.fn();

    count.observe(observer);
    expect(observer).toHaveBeenCalledWith(0); // Initial call

    count.value = 1;
    expect(observer).toHaveBeenCalledWith(1);
    expect(observer).toHaveBeenCalledTimes(2);
  });

  it("allows unsubscribing observers", () => {
    const count = state(0);
    const observer = vi.fn();

    const unsubscribe = count.observe(observer);
    count.value = 1;

    unsubscribe();
    count.value = 2;

    expect(observer).toHaveBeenCalledTimes(2); // Initial + first change only
    expect(observer).not.toHaveBeenCalledWith(2);
  });

  it("supports update function for derived state", () => {
    const count = state(0);
    count.update((current) => current + 1);
    expect(count.value).toBe(1);

    count.update((current) => current * 2);
    expect(count.value).toBe(2);
  });

  it("works with object state", () => {
    interface User {
      name: string;
      age: number;
    }

    const user = state<User>({ name: "John", age: 30 });

    expect(user.value.name).toBe("John");

    user.update((current) => ({ ...current, age: 31 }));
    expect(user.value.age).toBe(31);
    expect(user.value.name).toBe("John");
  });

  it("works with array state", () => {
    const items = state<Array<string>>(["a", "b"]);

    items.update((current) => [...current, "c"]);
    expect(items.value).toEqual(["a", "b", "c"]);

    items.value = [];
    expect(items.value).toEqual([]);
  });
});
