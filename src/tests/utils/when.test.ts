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

test.only("should render else content when initial condition is false", () => {
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
