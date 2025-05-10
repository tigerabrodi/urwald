import { el } from "../el";
import { renderList } from "../utils";

describe("renderList", () => {
  beforeEach(() => {
    // Set up a clean DOM environment for each test
    document.body.innerHTML = "";
  });

  test("should render a list of items from source array", () => {
    // Mock data
    const items = [
      { id: 1, text: "Item 1" },
      { id: 2, text: "Item 2" },
      { id: 3, text: "Item 3" },
    ];

    // Create a container
    const container = document.createElement("ul");
    document.body.appendChild(container);

    // Render the list
    const fragment = renderList(
      () => items,
      (item) =>
        el("li").text(item.text).attr({ "data-id": item.id.toString() }).done()
    );

    container.appendChild(fragment);

    // Check that the list was rendered correctly
    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(3);
    expect(listItems[0].textContent).toBe("Item 1");
    expect(listItems[1].textContent).toBe("Item 2");
    expect(listItems[2].textContent).toBe("Item 3");
    expect(listItems[0].getAttribute("data-id")).toBe("1");
  });

  // This test is just a placeholder since our current implementation
  // doesn't handle reactivity yet
  test("should update when source array changes", () => {
    // Note: This would require integration with your state management
    // For now, we're just checking the basic functionality
    const items = [{ id: 1, text: "Item 1" }];

    const getItems = () => items;

    const container = document.createElement("ul");
    document.body.appendChild(container);

    const fragment = renderList(getItems, (item) =>
      el("li").text(item.text).done()
    );

    container.appendChild(fragment);

    // Verification of initial state
    expect(container.querySelectorAll("li").length).toBe(1);
    expect(container.querySelector("li")?.textContent).toBe("Item 1");
  });
});
