/**
 * Function that observes state changes
 * @template ValueType The type of value being observed
 * @param value The current state value
 */
type Observer<ValueType> = (value: ValueType) => void;

/**
 * Interface for managing reactive state
 * @template ValueType The type of value being managed
 */
export interface StateManager<ValueType> {
  /**
   * The current state value
   * Reading this property returns the current state
   * Setting this property updates the state and notifies observers
   */
  value: ValueType;

  /**
   * Registers an observer function to be called when the state changes
   * @param observer Function to call when state changes
   * @returns A function that, when called, unregisters the observer
   */
  observe: (observer: Observer<ValueType>) => () => void;

  /**
   * Updates the state using an updater function
   * @param updater Function that receives the current state and returns the new state
   */
  update: (updater: (current: ValueType) => ValueType) => void;
}

/**
 * Creates a reactive state container that notifies observers of changes
 * @template ValueType The type of value to store in the state
 * @param initialValue The initial state value
 * @returns A StateManager object for managing the state
 * @example
 * const counter = state(0);
 *
 * // Subscribe to changes
 * const unsubscribe = counter.observe(value => console.log(`Counter: ${value}`));
 *
 * // Update the state
 * counter.value = 1;  // Logs: "Counter: 1"
 *
 * // Update with a function
 * counter.update(current => current + 1);  // Logs: "Counter: 2"
 *
 * // Unsubscribe when done
 * unsubscribe();
 */
export function state<ValueType>(
  initialValue: ValueType
): StateManager<ValueType> {
  let currentValue = initialValue;
  const observers = new Set<Observer<ValueType>>();

  /**
   * Notifies all observers of the current state value
   * @private
   */
  const notifyObservers = (): void => {
    observers.forEach((observer) => observer(currentValue));
  };

  return {
    get value(): ValueType {
      return currentValue;
    },

    set value(newValue: ValueType) {
      currentValue = newValue;
      notifyObservers();
    },

    observe: (observer: Observer<ValueType>): (() => void) => {
      observers.add(observer);
      // Call immediately with current value
      observer(currentValue);

      // Return unsubscribe function
      return () => {
        observers.delete(observer);
      };
    },

    update: (updater: (current: ValueType) => ValueType): void => {
      currentValue = updater(currentValue);
      notifyObservers();
    },
  };
}
