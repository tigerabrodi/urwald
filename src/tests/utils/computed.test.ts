import { describe, expect, it, vi } from "vitest";
import { state } from "../../state";
import { computed } from "../../utils";

describe("computed", () => {
  it("returns computed value and updates when dependencies change", () => {
    // Setup state
    const userState = state({
      firstName: "John",
      lastName: "Doe",
    });

    // Create computed value
    const fullName = computed(
      () => `${userState.state.firstName} ${userState.state.lastName}`,
      [userState]
    );

    // Initial value
    expect(fullName()).toBe("John Doe");

    // Update state
    userState.update((s) => {
      s.firstName = "Jane";
      return s;
    });

    // Computed value should update
    expect(fullName()).toBe("Jane Doe");
  });

  it("only recalculates when dependencies change", () => {
    // Setup state
    const userState = state({
      firstName: "John",
      lastName: "Doe",
    });

    // Create spy for getter
    const getter = vi.fn(
      () => `${userState.state.firstName} ${userState.state.lastName}`
    );

    // Create computed value
    const fullName = computed(getter, [userState]);

    // Initial calculation
    expect(fullName()).toBe("John Doe");
    expect(getter).toHaveBeenCalledTimes(1);

    // Access again without changes - should use cached value
    expect(fullName()).toBe("John Doe");
    expect(getter).toHaveBeenCalledTimes(1); // Still 1

    // Update state
    userState.state.firstName = "Jane";

    // Should recalculate
    expect(fullName()).toBe("Jane Doe");
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
