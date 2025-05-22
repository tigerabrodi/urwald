// Define types for the element creator

import { isTestMode } from "./internal/utils";

/**
 * Represents CSS styles that can be applied to an HTML element
 * A partial type of the CSSStyleDeclaration interface
 */
type Styles = Partial<CSSStyleDeclaration>;

/**
 * Event handler function type for HTML elements
 * @template HtmlTagName The HTML element tag name
 * @param e The event object associated with the event
 */
type EventHandler<HtmlTagName extends keyof HTMLElementEventMap> = (
  e: HTMLElementEventMap[HtmlTagName]
) => void;

// Global registry for parent observers and unmount callbacks
const parentObservers = new Map<HTMLElement, MutationObserver>();
export const unmountRegistry = new WeakMap<HTMLElement, Array<() => void>>();

function processRemovedNode(node: Node): void {
  if (node instanceof HTMLElement && unmountRegistry.has(node)) {
    const callbacks = unmountRegistry.get(node) || [];
    callbacks.forEach((callback) => callback());
    unmountRegistry.delete(node);
  }

  if (node.childNodes && node.childNodes.length > 0) {
    node.childNodes.forEach((child) => processRemovedNode(child));
  }
}

/**
 * The ElementCreator interface defines a chainable API for creating and manipulating DOM elements
 * @template T The type of HTML element being created
 */
export interface ElementCreator<T extends HTMLElement> {
  /**
   * Applies CSS styles to the element
   * @param styles Object containing CSS properties to apply
   * @returns The ElementCreator instance for chaining
   */
  style: (styles: Styles) => ElementCreator<T>;

  /**
   * Adds child elements to the current element
   * @param children Elements to add as children
   * @returns The ElementCreator instance for chaining
   */
  add: <Element extends HTMLElement>(
    ...children: Array<Element>
  ) => ElementCreator<T>;

  /**
   * Adds a callback to be called when the element is removed from the DOM
   * @param callback The callback to call when the element is removed from the DOM
   * @returns The ElementCreator instance for chaining
   */
  onUnmount: (callback: () => void) => ElementCreator<T>;

  /**
   * Sets the text content of the element
   * @param content Static string or function that returns dynamic text content
   * @returns The ElementCreator instance for chaining
   */
  text: (content: string | (() => string)) => ElementCreator<T>;

  /**
   * Attaches an event listener to the element
   * @param event The name of the event to listen for
   * @param handler Function to call when the event occurs
   * @returns The ElementCreator instance for chaining
   */
  on: <HtmlTagName extends keyof HTMLElementEventMap>(
    event: HtmlTagName,
    handler: EventHandler<HtmlTagName>
  ) => ElementCreator<T>;

  /**
   * Sets the CSS class name(s) for the element
   * @param names Space-separated list of class names
   * @returns The ElementCreator instance for chaining
   */
  class: (names: string) => ElementCreator<T>;

  /**
   * Sets attributes on the element
   * @param attrs Object mapping attribute names to values
   * @returns The ElementCreator instance for chaining
   */
  attr: (attrs: Record<string, string>) => ElementCreator<T>;

  /**
   * Finalizes and returns the created DOM element
   * @returns The created HTML element
   */
  done: () => T;
}

/**
 * Creates an HTML element with a chainable API for easy manipulation
 * @param tag The HTML tag name to create
 * @returns An ElementCreator for the created element with chainable methods
 * @example
 * // Create a button with text and click handler
 * const button = el('button')
 *   .text('Click me')
 *   .class('btn primary')
 *   .on('click', () => console.log('Button clicked!'))
 *   .done();
 */
export function el<HtmlTagName extends keyof HTMLElementTagNameMap>(
  tag: HtmlTagName
): ElementCreator<HTMLElementTagNameMap[HtmlTagName]> {
  const element = document.createElement(tag);
  const textSubscriptions: Array<() => string> = [];

  // Create the ElementCreator instance once
  const creator: ElementCreator<HTMLElementTagNameMap[HtmlTagName]> = {
    onUnmount: (callback) => {
      if (!unmountRegistry.has(element)) {
        unmountRegistry.set(element, []);
      }

      unmountRegistry.get(element)?.push(callback);

      if (!isTestMode) {
        const waitForConnection = () => {
          if (!element.isConnected) {
            console.log("Waiting for connection - element is not connected");
            setTimeout(waitForConnection, 50);
            return;
          }

          const parent = element.parentElement || document.body;

          // Create observer for this parent if needed
          if (!parentObservers.has(parent)) {
            const observer = new MutationObserver((mutations) => {
              for (const mutation of mutations) {
                console.log("processing mutation", mutation);
                mutation.removedNodes.forEach((node) =>
                  processRemovedNode(node)
                );
              }
            });

            observer.observe(parent, { childList: true });
            parentObservers.set(parent, observer);
          }
        };

        // Start the process
        waitForConnection();
      }

      // Wait until element is connected to set up observer
      return creator;
    },

    style: (styles) => {
      // Batch style updates in next animation frame for performance
      requestAnimationFrame(() => {
        Object.assign(element.style, styles);
      });
      return creator;
    },

    add: (...children) => {
      // Use document fragment for batch insertion
      // A DocumentFragment is a lightweight container that holds DOM nodes but isn't part of the active DOM tree itself. It's essentially a "virtual" container that exists only in memory.
      // Only single reflow needs to happen
      const fragment = document.createDocumentFragment();
      children.forEach((child) => fragment.appendChild(child));
      element.appendChild(fragment);
      return creator;
    },

    text: (content) => {
      if (typeof content === "function") {
        textSubscriptions.push(content);
        updateDynamicText();
      } else {
        element.textContent = content;
      }
      return creator;
    },

    on: <Event extends keyof HTMLElementEventMap>(
      event: Event,
      handler: EventHandler<Event>
    ) => {
      element.addEventListener(event, handler as EventListener);
      return creator;
    },

    class: (names) => {
      element.className = names;
      return creator;
    },

    attr: (attrs) => {
      Object.entries(attrs).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      return creator;
    },

    done: () => element,
  };

  /**
   * Updates the element's text content based on dynamic text subscriptions
   * @private
   */
  const updateDynamicText = (): void => {
    if (textSubscriptions.length > 0) {
      element.textContent = textSubscriptions.map((fn) => fn()).join("");
    }
  };

  return creator;
}
