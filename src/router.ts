import { el } from "./el";

export interface RouteDefinition {
  [path: string]: () => HTMLElement;
}

export interface Router {
  container: HTMLElement;
  navigate: (path: string) => void;
}

/**
 * Creates a client-side router
 * @param routes Object mapping paths to component functions
 * @returns A router instance
 */
export function router(routes: RouteDefinition): Router {
  // Create container element
  const container = document.createElement("div");

  // Store active component cleanup function if any
  let cleanup: (() => void) | null = null;

  // Function to render the current route
  const renderRoute = (path: string): void => {
    // Clear previous content
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Call cleanup if exists
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    // Get component for current path, or fallback to '/' or first route
    const route = routes[path] || routes["/"] || Object.values(routes)[0];

    if (route) {
      // Render the component
      const component = route();
      container.appendChild(component);

      // Store cleanup function if component returns one
      if (
        typeof component.getAttribute === "function" &&
        component.getAttribute("data-cleanup")
      ) {
        const cleanupFn = window[component.getAttribute("data-cleanup") as any];
        if (typeof cleanupFn === "function") {
          cleanup = cleanupFn;
        }
      }
    }
  };

  // Handle browser navigation
  window.addEventListener("popstate", () => {
    renderRoute(window.location.pathname);
  });

  // Initial render
  renderRoute(window.location.pathname);

  return {
    container,
    navigate: (path: string) => {
      // Update browser history
      window.history.pushState(null, "", path);
      renderRoute(path);
    },
  };
}

/**
 * Creates a link that works with the router
 * @param text Link text
 * @param path Target path
 * @param options Additional options (className, etc)
 * @returns An anchor element
 */
export function link(
  text: string,
  path: string,
  options: { className?: string } = {}
): HTMLElement {
  return el("a")
    .text(text)
    .attr({ href: path })
    .class(options.className || "")
    .on("click", (event) => {
      event.preventDefault();
      const routerInstance = (window as any).__urwaldRouter;
      if (routerInstance) {
        routerInstance.navigate(path);
      } else {
        console.warn(
          "Router instance not found. Make sure to create it first with router()."
        );
        window.location.href = path;
      }
    })
    .done();
}
