import { el } from "../../el";
import { state } from "../../state";
import { renderList } from "../../utils";

beforeEach(() => {
  // Set up a clean DOM environment for each test
  document.body.innerHTML = "";
});

test("should render initial items", () => {
  // Setup state with items
  const testState = state({
    items: [
      { id: 1, text: "Item 1" },
      { id: 2, text: "Item 2" },
      { id: 3, text: "Item 3" },
    ],
  });

  // Create container element
  const container = el("div").done();

  // Render list
  renderList({
    state: testState,
    getItems: (s) => s.items,
    itemRenderer: (item) => {
      const itemEl = el("span").done();
      itemEl.textContent = item.text;
      itemEl.dataset.id = String(item.id);
      return itemEl;
    },
    container,
    getItemKey: (item) => item.id,
  });

  // Assert correct number of elements created with correct content
  expect(container.children.length).toBe(3);
  expect(container.children[0].textContent).toBe("Item 1");
  expect(container.children[1].textContent).toBe("Item 2");
  expect(container.children[2].textContent).toBe("Item 3");
});

test("should add new items when state updates", () => {
  // Setup state with initial items
  const testState = state({
    items: [
      { id: 1, text: "Item 1" },
      { id: 2, text: "Item 2" },
    ],
  });

  // Create container element
  const container = el("div").done();

  // Render list
  renderList({
    state: testState,
    getItems: (s) => s.items,
    itemRenderer: (item) => {
      const itemEl = el("span").done();
      itemEl.textContent = item.text;
      itemEl.dataset.id = String(item.id);
      return itemEl;
    },
    container,
    getItemKey: (item) => item.id,
  });

  // Initial check
  expect(container.children.length).toBe(2);

  // Add item to state
  testState.update((s) => {
    s.items.push({ id: 3, text: "Item 3" });
    return s;
  });

  // Assert new element appears in DOM
  expect(container.children.length).toBe(3);
  expect(container.children[2].textContent).toBe("Item 3");
});

test("should remove items when deleted from state", () => {
  // Setup state with items
  const testState = state({
    items: [
      { id: 1, text: "Item 1" },
      { id: 2, text: "Item 2" },
      { id: 3, text: "Item 3" },
    ],
  });

  // Create container element
  const container = el("div").done();

  // Render list
  renderList({
    state: testState,
    getItems: (s) => s.items,
    itemRenderer: (item) => {
      const itemEl = el("span").done();
      itemEl.textContent = item.text;
      itemEl.dataset.id = String(item.id);
      return itemEl;
    },
    container,
    getItemKey: (item) => item.id,
  });

  // Initial check
  expect(container.children.length).toBe(3);

  // Remove middle item from state
  testState.update((s) => {
    s.items = s.items.filter((item) => item.id !== 2);
    return s;
  });

  // Assert element is removed from DOM
  expect(container.children.length).toBe(2);
  expect(container.children[0].textContent).toBe("Item 1");
  expect(container.children[1].textContent).toBe("Item 3");
});

test("should update items when data changes", () => {
  // Setup state with items
  const testState = state({
    items: [
      { id: 1, text: "Item 1" },
      { id: 2, text: "Item 2" },
    ],
  });

  // Create container element
  const container = el("div").done();

  // Render list
  renderList({
    state: testState,
    getItems: (s) => s.items,
    itemRenderer: (item) => {
      const itemEl = el("span").done();
      itemEl.textContent = item.text;
      itemEl.dataset.id = String(item.id);
      return itemEl;
    },
    container,
    getItemKey: (item) => item.id,
  });

  // Initial check
  expect(container.children.length).toBe(2);
  expect(container.children[1].textContent).toBe("Item 2");

  // Modify item in state
  testState.update((s) => {
    s.items[1].text = "Updated Item 2";
    return s;
  });

  // Assert element content is updated
  expect(container.children.length).toBe(2);
  expect(container.children[1].textContent).toBe("Updated Item 2");
});

test("should stop updating after cleanup", () => {
  // Setup state with items
  const testState = state({
    items: [
      { id: 1, text: "Item 1" },
      { id: 2, text: "Item 2" },
    ],
  });

  // Create container element
  const container = el("div").done();

  // Render list and get cleanup function
  const cleanup = renderList({
    state: testState,
    getItems: (s) => s.items,
    itemRenderer: (item) => {
      const itemEl = el("span").done();
      itemEl.textContent = item.text;
      itemEl.dataset.id = String(item.id);
      return itemEl;
    },
    container,
    getItemKey: (item) => item.id,
  });

  // Initial check
  expect(container.children.length).toBe(2);

  // Call cleanup function
  cleanup();

  // Change state
  testState.update((s) => {
    s.items.push({ id: 3, text: "Item 3" });
    return s;
  });

  // Assert DOM remains unchanged
  expect(container.children.length).toBe(2);
  expect(container.children[0].textContent).toBe("Item 1");
  expect(container.children[1].textContent).toBe("Item 2");
});
