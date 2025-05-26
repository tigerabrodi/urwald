import { el } from "./el";

type RouteElement = {
  element: HTMLElement;
  cleanup: (() => void) | null;
};

/**
 * Query parameters object type
 */
export type QueryParams = Record<string, string | number | boolean>;

/**
 * Defines route mappings from URL paths to component functions
 * Each key is a URL path and each value is a function that returns an HTMLElement
 */
export interface RouteDefinition {
  [path: string]: () => RouteElement;
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
   * @param queryParams Optional query parameters to include in the URL
   */
  navigate: (path: string, queryParams?: QueryParams) => void;

  /**
   * Gets the current query parameters from the URL
   * @returns Object containing current query parameters
   */
  getQueryParams: () => Record<string, string>;

  /**
   * Updates only the query parameters without changing the current route
   * @param params Query parameters to update
   */
  updateQueryParams: (params: QueryParams) => void;
}

/**
 * Parses URL search string into an object
 * @param search The search string (e.g., "?foo=bar&baz=qux")
 * @returns Object with parsed query parameters
 */
function parseQueryParams(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  const urlParams = new URLSearchParams(search);

  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }

  return params;
}

/**
 * Serializes an object into a URL search string
 * @param params Object to serialize
 * @returns URL search string (e.g., "?foo=bar&baz=qux")
 */
function serializeQueryParams(params: QueryParams): string {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    urlParams.set(key, String(value));
  });

  const searchString = urlParams.toString();
  return searchString ? `?${searchString}` : "";
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

    // Call cleanup if exists before we render new route
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    // Get component for current path, or fallback to '/' or first route
    const route = routes[path] || routes["/"] || Object.values(routes)[0];

    if (route) {
      const { element, cleanup: routeCleanupFn } = route();
      container.appendChild(element);

      if (routeCleanupFn) {
        cleanup = routeCleanupFn;
      }
    }
  };

  window.addEventListener("popstate", () => {
    renderRoute(window.location.pathname);
  });

  // Initial render
  renderRoute(window.location.pathname);

  return {
    container,

    navigate: (path: string, queryParams?: QueryParams) => {
      const searchString = queryParams ? serializeQueryParams(queryParams) : "";
      const fullUrl = `${path}${searchString}`;

      window.history.pushState(null, "", fullUrl);
      renderRoute(path);
    },

    getQueryParams: () => {
      return parseQueryParams(window.location.search);
    },

    updateQueryParams: (params: QueryParams) => {
      const currentPath = window.location.pathname;
      const searchString = serializeQueryParams(params);
      const fullUrl = `${currentPath}${searchString}`;

      window.history.pushState(null, "", fullUrl);
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
export function link({
  text,
  path,
  options,
}: {
  text: string;
  path: string;
  options: { className?: string };
}): HTMLElement {
  return el("a")
    .text(text)
    .attr({ href: path })
    .class(options.className || "")
    .on("click", (event) => {
      event.preventDefault();

      const routerInstance = (window as unknown as { __urwaldRouter: Router })
        .__urwaldRouter;
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
