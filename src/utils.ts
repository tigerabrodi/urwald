import { StateManager } from "./state";

/**
 * Renders a list of items dynamically, updating when the source data changes
 * @template T The type of items in the list
 * @param itemsGetter A function that returns the current array of items
 * @param itemRenderer A function that renders each individual item into an HTML element
 * @returns A fragment containing the rendered items
 */
export function renderList<T, S extends object>({
  state,
  getItems,
  itemRenderer,
  container,
  getItemKey = (item: T) => JSON.stringify(item),
}: {
  state: StateManager<S>;
  getItems: (state: S) => Array<T>;
  itemRenderer: (item: T) => HTMLElement;
  container: HTMLElement;
  getItemKey?: (item: T) => string | number;
}): () => void {
  // Track both elements and their data
  const elementMap = new Map<
    string | number,
    {
      element: HTMLElement;
      data: T;
    }
  >();

  const unsubscribe = state.observe((currentState) => {
    const items = getItems(currentState);
    const currentKeys = new Set<string | number>();

    // Process all items
    items.forEach((item) => {
      const key = getItemKey(item);
      currentKeys.add(key);

      const existing = elementMap.get(key);

      // Only create new element if:
      // 1. Element doesn't exist yet OR
      // 2. Data has changed
      if (!existing || !isDeepEqual(item, existing.data)) {
        const element = itemRenderer(item);

        if (existing) {
          // replaceChild may be less efficient than just updating the existing element
          // but this is fine for the current implementation
          container.replaceChild(element, existing.element);
        } else {
          container.appendChild(element);
        }

        elementMap.set(key, {
          element,
          // need to turn proxy into plain object to use it with structuredClone
          data: structuredClone({ ...item }), // Deep clone to avoid reference issues
        });
      }
    });

    for (const [key, { element }] of elementMap.entries()) {
      if (!currentKeys.has(key)) {
        container.removeChild(element);
        elementMap.delete(key);
      }
    }
  });

  return unsubscribe;
}

/**
 * Deep equality check function
 * @param a - The first value to compare
 * @param b - The second value to compare
 * @returns true if the values are deeply equal, false otherwise
 */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => {
    return (
      keysB.includes(key) &&
      isDeepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  });
}

/**
 * Conditionally renders content based on a state condition
 * @template T The type of the state object
 * @param options Configuration options
 * @returns A function to clean up the conditional rendering
 */
export function when<T extends object>({
  state,
  condition,
  render,
  else: renderElse,
  container,
}: {
  state: StateManager<T>;
  condition: (state: T) => boolean;
  render: () => HTMLElement;
  else?: () => HTMLElement;
  container: HTMLElement;
}): () => void {
  let currentElement: HTMLElement | null = null;
  let currentCondition: boolean;

  const renderElement = (shouldRender: boolean) => {
    if (currentElement) {
      container.removeChild(currentElement);
      currentElement = null;
    }

    if (shouldRender) {
      currentElement = render();
    } else if (renderElse) {
      currentElement = renderElse();
    }

    if (currentElement) {
      container.appendChild(currentElement);
    }

    currentCondition = shouldRender;
  };

  const initialCondition = condition(state.state);
  // handle initial render
  renderElement(initialCondition);

  const unsubscribe = state.observe((newState) => {
    const newCondition = condition(newState);

    if (newCondition !== currentCondition) {
      renderElement(newCondition);
    }
  });

  return () => {
    unsubscribe();
    if (currentElement && container.contains(currentElement)) {
      container.removeChild(currentElement);
    }
  };
}
