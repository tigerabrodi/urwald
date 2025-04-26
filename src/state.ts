type Observer<ValueType> = (value: ValueType) => void;

export interface StateManager<ValueType> {
  value: ValueType;
  observe: (observer: Observer<ValueType>) => () => void;
  update: (updater: (current: ValueType) => ValueType) => void;
}

/**
 * Creates a reactive state container
 * @param initialValue The initial state value
 * @returns A StateManager for the state
 */
export function state<ValueType>(
  initialValue: ValueType
): StateManager<ValueType> {
  let currentValue = initialValue;
  const observers = new Set<Observer<ValueType>>();

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
