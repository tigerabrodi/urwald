/**
 * Function that observes state changes
 */
type Observer<T> = (value: T) => void;

/**
 * Interface for a reactive state manager
 */
export interface StateManager<T extends object> {
  /**
   * The reactive state object
   * Properties can be accessed and modified directly
   */
  state: T;

  /**
   * Register an observer function to be called when state changes
   * @param observer Function to call with the current state when changes occur
   * @returns Function to unsubscribe the observer
   */
  observe: (observer: Observer<T>) => () => void;

  /**
   * Updates the state using an updater function
   * @param updater Function that receives current state and returns updated state
   */
  update: (updater: (current: T) => T) => void;
}

/**
 * Creates a reactive state object using JavaScript Proxy
 * @param initialValue The initial state
 * @returns A reactive state manager
 * @example
 * const user = state({ name: "John", age: 30 });
 *
 * // Subscribe to changes
 * const unsubscribe = user.observe(state => {
 *   console.log(`User updated: ${state.name}, ${state.age}`);
 * });
 *
 * // Update properties naturally
 * user.state.name = "Jane"; // Logs: "User updated: Jane, 30"
 * user.state.age = 31;      // Logs: "User updated: Jane, 31"
 *
 * // Unsubscribe when done
 * unsubscribe();
 */
export function state<T extends object>(initialValue: T): StateManager<T> {
  // Clone initial value to avoid external mutations
  const target = structuredClone(initialValue);
  const observers = new Set<Observer<T>>();

  /**
   * Recursively create proxies for nested objects
   */
  function makeReactive<K extends object>(obj: K): K {
    const isArray = Array.isArray(obj);

    return new Proxy(obj, {
      get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);

        // Handle array methods that modify the array
        if (isArray && typeof value === "function") {
          const method = String(prop);
          const mutatingMethods = [
            "push",
            "pop",
            "shift",
            "unshift",
            "splice",
            "sort",
            "reverse",
            "fill",
          ];

          if (mutatingMethods.includes(method)) {
            return function (...args: Array<unknown>) {
              const result = (
                value as (...args: Array<unknown>) => unknown
              ).apply(target, args);
              notifyObservers();
              return result;
            };
          }
        }

        // Create proxies for nested objects and arrays
        if (value && typeof value === "object") {
          return makeReactive(value as object) as unknown;
        }

        return value;
      },

      set(target, prop, value, receiver) {
        const oldValue = Reflect.get(target, prop, receiver);
        // Only trigger updates if value actually changed
        if (oldValue !== value) {
          const isSet = Reflect.set(target, prop, value, receiver);
          notifyObservers();
          return isSet;
        }
        return true;
      },

      deleteProperty(target, prop) {
        if (prop in target) {
          const isDeleted = Reflect.deleteProperty(target, prop);
          notifyObservers();
          return isDeleted;
        }
        return true;
      },
    });
  }

  /**
   * Notifies all observers with the current state
   */
  function notifyObservers(): void {
    observers.forEach((observer) => observer(reactiveState));
  }

  // Create the top-level proxy
  const reactiveState = makeReactive(target);

  // The public API
  const manager: StateManager<T> = {
    state: reactiveState,

    observe(observer: Observer<T>): () => void {
      observers.add(observer);
      // Call immediately with current state
      observer(reactiveState);

      // Return unsubscribe function
      return () => {
        observers.delete(observer);
      };
    },

    update(updater: (current: T) => T): void {
      // Pass the state to the updater and let it make changes
      // Since we're using a proxy, any changes will automatically trigger observers
      updater(reactiveState);
      // No need to explicitly notify observers - the proxy will do that
    },
  };

  return manager;
}
