import { el } from "../el";
import { state } from "../state";
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
    renderList({
      container,
      state: state({ items }),
      getItems: (state) => state.items,
      itemRenderer: (item) =>
        el("li").text(item.text).attr({ "data-id": item.id.toString() }).done(),
      getItemKey: (item) => item.id,
    });

    // Check that the list was rendered correctly
    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(3);
    expect(listItems[0].textContent).toBe("Item 1");
    expect(listItems[1].textContent).toBe("Item 2");
    expect(listItems[2].textContent).toBe("Item 3");
    expect(listItems[0].getAttribute("data-id")).toBe("1");
  });
});
