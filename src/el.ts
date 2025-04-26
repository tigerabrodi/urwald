// Define types for the element creator
type Styles = Partial<CSSStyleDeclaration>;
type EventHandler<HtmlTagName extends keyof HTMLElementEventMap> = (
  e: HTMLElementEventMap[HtmlTagName]
) => void;

// The ElementCreator interface defines the chainable API
export interface ElementCreator<T extends HTMLElement> {
  style: (styles: Styles) => ElementCreator<T>;
  add: <Element extends HTMLElement>(
    ...children: Element[]
  ) => ElementCreator<T>;
  text: (content: string | (() => string)) => ElementCreator<T>;
  on: <HtmlTagName extends keyof HTMLElementEventMap>(
    event: HtmlTagName,
    handler: EventHandler<HtmlTagName>
  ) => ElementCreator<T>;
  class: (names: string) => ElementCreator<T>;
  attr: (attrs: Record<string, string>) => ElementCreator<T>;
  done: () => T;
}

/**
 * Creates an HTML element with a chainable API
 * @param tag The HTML tag name to create
 * @returns An ElementCreator for the created element
 */
export function el<HtmlTagName extends keyof HTMLElementTagNameMap>(
  tag: HtmlTagName
): ElementCreator<HTMLElementTagNameMap[HtmlTagName]> {
  const element = document.createElement(tag);
  const textSubscriptions: Array<() => string> = [];

  // Create the ElementCreator instance once
  const creator: ElementCreator<HTMLElementTagNameMap[HtmlTagName]> = {
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

  // Update dynamic text content if needed
  const updateDynamicText = (): void => {
    if (textSubscriptions.length > 0) {
      element.textContent = textSubscriptions.map((fn) => fn()).join("");
    }
  };

  return creator;
}
