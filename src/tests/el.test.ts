import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../el";

describe("el function", () => {
  beforeEach(() => {
    // Setup: create a container for our tests
    const container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup after each test
    const container = document.getElementById("test-container");
    if (container) {
      container.remove();
    }
  });

  it("creates an HTML element with the specified tag", () => {
    const button = el("button").done();
    expect(button.tagName).toBe("BUTTON");
  });

  it("sets text content", () => {
    const text = "Click me";
    const button = el("button").text(text).done();
    expect(button.textContent).toBe(text);
  });

  it("supports dynamic text content with functions", () => {
    let count = 0;
    const button = el("button")
      .text(() => `Count: ${count}`)
      .done();

    expect(button.textContent).toBe("Count: 0");
    count = 1;
    // Need to trigger an update here in a real app
  });

  it("adds CSS classes", () => {
    const button = el("button").class("btn btn-primary").done();

    expect(button.className).toBe("btn btn-primary");
  });

  it("sets attributes", () => {
    const link = el("a")
      .attr({ href: "https://example.com", target: "_blank" })
      .done();

    expect(link.getAttribute("href")).toBe("https://example.com");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("attaches event listeners", () => {
    const handleClick = vi.fn();
    const button = el("button").on("click", handleClick).done();

    button.click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("adds child elements", () => {
    const parent = el("div")
      .add(el("span").text("Child 1").done(), el("span").text("Child 2").done())
      .done();

    expect(parent.children.length).toBe(2);
    expect(parent.children[0].textContent).toBe("Child 1");
    expect(parent.children[1].textContent).toBe("Child 2");
  });

  it("sets styles", () => {
    vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
      fn(0);
      return 0;
    });

    const div = el("div").style({ color: "red", fontSize: "16px" }).done();

    expect(div.style.color).toBe("red");
    expect(div.style.fontSize).toBe("16px");

    vi.unstubAllGlobals();
  });

  it("chains methods correctly", () => {
    const button = el("button")
      .class("btn")
      .text("Click me")
      .attr({ type: "button" })
      .style({ color: "blue" })
      .done();

    expect(button.className).toBe("btn");
    expect(button.textContent).toBe("Click me");
    expect(button.getAttribute("type")).toBe("button");
  });
});
