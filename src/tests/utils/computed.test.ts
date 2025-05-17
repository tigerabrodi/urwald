import { describe, expect, it, vi } from "vitest";
import { state } from "../../state";
import { computed } from "../../utils";

describe("computed", () => {
  it("returns computed value and updates when dependencies change", () => {
    const userState = state({
      firstName: "John",
      lastName: "Doe",
    });

    const fullName = computed(
      () => `${userState.state.firstName} ${userState.state.lastName}`,
      [userState]
    );

    expect(fullName()).toBe("John Doe");

    userState.update((s) => {
      s.firstName = "Jane";
      return s;
    });

    expect(fullName()).toBe("Jane Doe");
  });

  it("only recalculates when dependencies change", () => {
    // Setup state
    const userState = state({
      firstName: "John",
      lastName: "Doe",
    });

    const getter = vi.fn(
      () => `${userState.state.firstName} ${userState.state.lastName}`
    );

    const fullName = computed(getter, [userState]);

    // runs twice
    // once on intiialization
    // and once when we call the computed function
    expect(fullName()).toBe("John Doe");
    expect(getter).toHaveBeenCalledTimes(2);

    expect(fullName()).toBe("John Doe");
    expect(getter).toHaveBeenCalledTimes(2);

    userState.state.firstName = "Jane";

    expect(fullName()).toBe("Jane Doe");
    expect(getter).toHaveBeenCalledTimes(3);
  });

  it("updates when any dependency changes", () => {
    const userState = state({ firstName: "John" });
    const jobState = state({ title: "Developer" });

    const description = computed(
      () => `${userState.state.firstName} - ${jobState.state.title}`,
      [userState, jobState]
    );

    expect(description()).toBe("John - Developer");

    // Update first dependency
    userState.state.firstName = "Jane";
    expect(description()).toBe("Jane - Developer");

    // Update second dependency
    jobState.state.title = "Designer";
    expect(description()).toBe("Jane - Designer");
  });
});
