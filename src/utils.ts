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

/**
 * Creates a debounced function that delays execution until after wait
 * milliseconds have passed without additional calls
 */
export function debounce<Args extends Array<unknown>, Return>(
  func: (...args: Args) => Return,
  wait: number
): {
  (...args: Args): void;
  cancel: () => void;
  flush: () => Return | undefined;
} {
  let timeoutId: NodeJS.Timeout | undefined;
  let lastArgs: Args | undefined;
  let result: Return | undefined;

  function debounced(...args: Args): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    lastArgs = args;

    timeoutId = setTimeout(() => {
      if (lastArgs) {
        result = func(...lastArgs);
      }
    }, wait);
  }

  debounced.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  debounced.flush = () => {
    debounced.cancel();
    if (lastArgs) {
      result = func(...lastArgs);
    }
    return result;
  };

  return debounced;
}

/**
 * Creates a throttled function that limits execution to once per wait period
 */
export function throttle<Args extends Array<unknown>, Return>(
  func: (...args: Args) => Return,
  wait: number
): {
  (...args: Args): Return | undefined;
  cancel: () => void;
} {
  let lastCallTime: number | undefined;
  let timeoutId: NodeJS.Timeout | undefined;
  let lastArgs: Args | undefined;
  let result: Return | undefined;

  function throttled(...args: Args): Return | undefined {
    const now = Date.now();

    const timeSinceLastCall = now - (lastCallTime ?? 0);
    const hasWaitedLongEnough = timeSinceLastCall >= wait;

    // if it's the first call or the wait time has passed, call the function
    if (lastCallTime === undefined || hasWaitedLongEnough) {
      lastCallTime = now;
      result = func(...args);
      return result;
    }

    lastArgs = args;

    // if function is not already scheduled to be called, schedule it
    if (timeoutId === undefined) {
      timeoutId = setTimeout(() => {
        if (lastArgs) {
          lastCallTime = Date.now();
          result = func(...lastArgs);
          lastArgs = undefined;
        }
        timeoutId = undefined;
      }, wait - (now - lastCallTime));
    }

    return result;
  }

  throttled.cancel = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return throttled;
}

/**
 * Toggles one or more CSS classes on an element
 * @param options Configuration options
 */
export function toggleClass({
  element,
  class: className,
  condition,
}: {
  element: HTMLElement;
  class: string | Array<string>;
  condition?: boolean;
}): void {
  const classes = Array.isArray(className) ? className : [className];

  classes.forEach((cls) => {
    if (condition === undefined) {
      element.classList.toggle(cls);
    } else {
      if (condition) {
        element.classList.add(cls);
      } else {
        element.classList.remove(cls);
      }
    }
  });
}

/**
 * Creates a computed value that re-evaluates when its dependencies change
 * @template T The type of the computed value
 * @param getter A function that returns the computed value
 * @param dependencies An array of state managers that the computed value depends on
 * @returns A function that returns the computed value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computed<T, S extends Array<StateManager<any>>>(
  getter: () => T,
  dependencies: [...S]
): () => T {
  let cachedValue = getter();
  let isValid = true;

  dependencies.forEach((dep) => {
    dep.observe(() => {
      isValid = false;
    });
  });

  return () => {
    if (!isValid) {
      cachedValue = getter();
      isValid = true;
    }
    return cachedValue;
  };
}
