import { el } from "../../el";
import { state } from "../../state";
import { when } from "../../utils";

beforeEach(() => {
  // Set up a clean DOM environment for each test
  document.body.innerHTML = "";
});

test("should render correctly when initial condition is true", () => {
  const testState = state({
    isVisible: true,
  });

  const container = el("div").done();
  document.body.appendChild(container);

  when({
    state: testState,
    condition: (s) => s.isVisible,
    render: () => {
      return el("div").class("content").text("Visible content").done();
    },
    else: () => {
      return el("div").class("placeholder").text("Hidden content").done();
    },
    container,
  });

  expect(container.children.length).toBe(1);
  expect(container.children[0].className).toBe("content");
  expect(container.children[0].textContent).toBe("Visible content");
});

test("should render else content when initial condition is false", () => {
  const testState = state({
    isVisible: false,
  });

  const container = el("div").done();
  document.body.appendChild(container);

  when({
    state: testState,
    condition: (s) => s.isVisible,
    render: () => {
      return el("div").class("content").text("Visible content").done();
    },
    else: () => {
      return el("div").class("placeholder").text("Hidden content").done();
    },
    container,
  });

  expect(container.children.length).toBe(1);
  expect(container.children[0].className).toBe("placeholder");
  expect(container.children[0].textContent).toBe("Hidden content");
});

test("should update when condition changes", () => {
  const testState = state({
    isVisible: false,
  });

  const container = el("div").done();
  document.body.appendChild(container);

  when({
    state: testState,
    condition: (s) => s.isVisible,
    render: () => {
      return el("div").class("content").text("Visible content").done();
    },
    else: () => {
      return el("div").class("placeholder").text("Hidden content").done();
    },
    container,
  });

  expect(container.children[0].className).toBe("placeholder");

  testState.update((s) => {
    s.isVisible = true;
    return s;
  });

  expect(container.children.length).toBe(1);
  expect(container.children[0].className).toBe("content");
  expect(container.children[0].textContent).toBe("Visible content");

  testState.update((s) => {
    s.isVisible = false;
    return s;
  });

  expect(container.children.length).toBe(1);
  expect(container.children[0].className).toBe("placeholder");
  expect(container.children[0].textContent).toBe("Hidden content");
});

test("should clean up and stop updating when cleanup function is called", () => {
  // Setup
  const testState = state({
    isVisible: true,
  });

  const container = el("div").done();
  document.body.appendChild(container);

  // Execute
  const cleanup = when({
    state: testState,
    condition: (s) => s.isVisible,
    render: () => {
      return el("div").class("content").text("Visible content").done();
    },
    else: () => {
      return el("div").class("placeholder").text("Hidden content").done();
    },
    container,
  });

  // Initial check
  expect(container.children.length).toBe(1);
  expect(container.children[0].className).toBe("content");

  // Clean up
  cleanup();

  // Verify element was removed
  expect(container.children.length).toBe(0);

  // Change state after cleanup
  testState.update((s) => {
    s.isVisible = false;
    return s;
  });

  // Verify no updates occurred
  expect(container.children.length).toBe(0);
});
