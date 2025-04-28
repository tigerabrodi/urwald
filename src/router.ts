import { el } from "./el";

/**
 * Defines route mappings from URL paths to component functions
 * Each key is a URL path and each value is a function that returns an HTMLElement
 */
export interface RouteDefinition {
  [path: string]: () => HTMLElement;
}

/**
 * Interface for the router object that manages navigation and rendering
 */
export interface Router {
  /**
   * The container element where route components will be rendered
   */
  container: HTMLElement;

  /**
   * Navigates to a specific path and renders the corresponding component
   * @param path The URL path to navigate to
   */
  navigate: (path: string) => void;
}

/**
 * Creates a client-side router that handles navigation and rendering of components
 * @param routes Object mapping paths to component functions
 * @returns A router instance with navigation methods and container element
 * @example
 * const myRouter = router({
 *   '/': () => homePage(),
 *   '/about': () => aboutPage(),
 *   '/contact': () => contactPage()
 * });
 * document.body.appendChild(myRouter.container);
 */
export function router(routes: RouteDefinition): Router {
  // Create container element
  const container = document.createElement("div");

  // Store active component cleanup function if any
  let cleanup: (() => void) | null = null;

  /**
   * Renders the component for the specified path
   * @param path The URL path to render
   */
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
 * Creates a link element that works with the router for client-side navigation
 * @param text Link text to display
 * @param path Target URL path to navigate to
 * @param options Additional options for the link (e.g., className)
 * @returns An anchor element configured for client-side routing
 * @example
 * const homeLink = link('Home', '/', { className: 'nav-link' });
 * navbar.appendChild(homeLink);
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
