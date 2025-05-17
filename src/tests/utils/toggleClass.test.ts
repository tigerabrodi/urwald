import { describe, expect, it } from "vitest";
import { el } from "../../el";
import { toggleClass } from "../../utils";

describe("toggleClass", () => {
  it("adds class when condition is true", () => {
    const element = el("div").done();

    toggleClass({
      element,
      class: "active",
      condition: true,
    });

    expect(element.classList.contains("active")).toBe(true);
  });

  it("removes class when condition is false", () => {
    const element = el("div").class("active").done();

    toggleClass({
      element,
      class: "active",
      condition: false,
    });

    expect(element.classList.contains("active")).toBe(false);
  });

  it("toggles class when condition is undefined", () => {
    const element = el("div").done();

    // Add class when not present
    toggleClass({
      element,
      class: "active",
    });
    expect(element.classList.contains("active")).toBe(true);

    // Remove class when present
    toggleClass({
      element,
      class: "active",
    });
    expect(element.classList.contains("active")).toBe(false);
  });

  it("handles multiple classes", () => {
    const element = el("div").done();

    toggleClass({
      element,
      class: ["active", "highlight"],
      condition: true,
    });

    expect(element.classList.contains("active")).toBe(true);
    expect(element.classList.contains("highlight")).toBe(true);
  });
});
