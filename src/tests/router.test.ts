import { beforeEach, describe, expect, it, vi } from "vitest";
import { el } from "../el";
import { link, router, Router } from "../router";

describe("router function", () => {
  beforeEach(() => {
    // Setup a clean DOM environment
    document.body.innerHTML = "";

    // Mock history API
    vi.stubGlobal("history", {
      pushState: vi.fn(),
    });

    // Reset location
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/",
        search: "",
      },
      writable: true,
    });
  });

  it("creates a router with container element", () => {
    const routes = {
      "/": () => ({
        element: el("div").text("Home").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);
    expect(routerInstance.container).toBeInstanceOf(HTMLDivElement);
  });

  it("renders the current route", () => {
    const routes = {
      "/": () => ({
        element: el("div").text("Home").done(),
        cleanup: null,
      }),
      "/about": () => ({
        element: el("div").text("About").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);
    document.body.appendChild(routerInstance.container);

    expect(routerInstance.container.textContent).toBe("Home");
  });

  it("navigates to different routes", () => {
    const routes = {
      "/": () => ({
        element: el("div").text("Home").done(),
        cleanup: null,
      }),
      "/about": () => ({
        element: el("div").text("About").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);
    document.body.appendChild(routerInstance.container);

    routerInstance.navigate("/about");
    expect(routerInstance.container.textContent).toBe("About");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(window.history.pushState).toHaveBeenCalledWith(null, "", "/about");
  });

  it("navigates with query parameters", () => {
    const routes = {
      "/": () => ({
        element: el("div").text("Home").done(),
        cleanup: null,
      }),
      "/products": () => ({
        element: el("div").text("Products").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);
    document.body.appendChild(routerInstance.container);

    routerInstance.navigate("/products", {
      category: "electronics",
      sort: "price",
    });

    expect(routerInstance.container.textContent).toBe("Products");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "/products?category=electronics&sort=price"
    );
  });

  it("gets current query parameters", () => {
    // Mock location with search params
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/products",
        search: "?category=electronics&sort=price",
      },
      writable: true,
    });

    const routes = {
      "/products": () => ({
        element: el("div").text("Products").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);
    const queryParams = routerInstance.getQueryParams();

    expect(queryParams).toEqual({
      category: "electronics",
      sort: "price",
    });
  });

  it("updates query parameters without changing route", () => {
    // Mock location
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/products",
        search: "",
      },
      writable: true,
    });

    const routes = {
      "/products": () => ({
        element: el("div").text("Products").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);
    document.body.appendChild(routerInstance.container);

    routerInstance.updateQueryParams({ page: 2, filter: "active" });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(window.history.pushState).toHaveBeenCalledWith(
      null,
      "",
      "/products?page=2&filter=active"
    );
  });

  it("observes query parameter changes reactively", () => {
    const observer = vi.fn();

    // Mock location with initial search params
    const mockLocation = {
      pathname: "/products",
      search: "?category=electronics",
    };

    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    const routes = {
      "/products": () => ({
        element: el("div").text("Products").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);

    // Subscribe to query param changes
    const unsubscribe = routerInstance.observeQueryParams(observer);

    // Should be called immediately with current params
    expect(observer).toHaveBeenCalledWith({ category: "electronics" });
    expect(observer).toHaveBeenCalledTimes(1);

    // Update the mock location search to simulate updateQueryParams
    mockLocation.search = "?category=books&sort=price";

    // Update query params
    routerInstance.updateQueryParams({ category: "books", sort: "price" });

    // Observer should be called with new params
    expect(observer).toHaveBeenCalledWith({ category: "books", sort: "price" });
    expect(observer).toHaveBeenCalledTimes(2);

    // Unsubscribe
    unsubscribe();

    // Update mock location again
    mockLocation.search = "?page=2";

    // Update again - observer should not be called
    routerInstance.updateQueryParams({ page: 2 });
    expect(observer).toHaveBeenCalledTimes(2);
  });

  it("notifies query observers on navigation with query params", () => {
    const observer = vi.fn();

    // Mock location with empty search initially
    const mockLocation = {
      pathname: "/",
      search: "",
    };

    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    const routes = {
      "/": () => ({
        element: el("div").text("Home").done(),
        cleanup: null,
      }),
      "/products": () => ({
        element: el("div").text("Products").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);
    document.body.appendChild(routerInstance.container);

    // Subscribe to query param changes
    routerInstance.observeQueryParams(observer);

    // Should be called immediately with empty params
    expect(observer).toHaveBeenCalledWith({});
    expect(observer).toHaveBeenCalledTimes(1);

    // Update mock location to simulate navigation
    mockLocation.pathname = "/products";
    mockLocation.search = "?category=electronics";

    // Navigate with query params
    routerInstance.navigate("/products", { category: "electronics" });

    // Observer should be called with new params
    expect(observer).toHaveBeenCalledWith({ category: "electronics" });
    expect(observer).toHaveBeenCalledTimes(2);
  });

  it("handles multiple query parameter observers", () => {
    const observer1 = vi.fn();
    const observer2 = vi.fn();

    // Mock location with empty search initially
    const mockLocation = {
      pathname: "/products",
      search: "",
    };

    Object.defineProperty(window, "location", {
      value: mockLocation,
      writable: true,
    });

    const routes = {
      "/products": () => ({
        element: el("div").text("Products").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);

    // Subscribe multiple observers
    const unsubscribe1 = routerInstance.observeQueryParams(observer1);
    const unsubscribe2 = routerInstance.observeQueryParams(observer2);

    // Both should be called immediately
    expect(observer1).toHaveBeenCalledWith({});
    expect(observer2).toHaveBeenCalledWith({});

    // Update mock location
    mockLocation.search = "?category=electronics";

    // Update query params
    routerInstance.updateQueryParams({ category: "electronics" });

    // Both observers should be called
    expect(observer1).toHaveBeenCalledWith({ category: "electronics" });
    expect(observer2).toHaveBeenCalledWith({ category: "electronics" });

    // Unsubscribe first observer
    unsubscribe1();

    // Update mock location again
    mockLocation.search = "?sort=price";

    // Update again
    routerInstance.updateQueryParams({ sort: "price" });

    // Only second observer should be called
    expect(observer1).toHaveBeenCalledTimes(2);
    expect(observer2).toHaveBeenCalledTimes(3);
    expect(observer2).toHaveBeenLastCalledWith({ sort: "price" });

    unsubscribe2();
  });

  it("calls cleanup function when navigating to a new route", () => {
    const homeCleanup = vi.fn();

    const routes = {
      "/": () => ({
        element: el("div").text("Home").done(),
        cleanup: homeCleanup,
      }),
      "/about": () => ({
        element: el("div").text("About").done(),
        cleanup: null,
      }),
    };

    const routerInstance = router(routes);
    document.body.appendChild(routerInstance.container);

    // Navigate to about page
    routerInstance.navigate("/about");

    // Home cleanup should be called
    expect(homeCleanup).toHaveBeenCalledTimes(1);
  });

  it("creates navigation links", () => {
    // Mock router instance
    (window as unknown as { __urwaldRouter: Router }).__urwaldRouter = {
      navigate: vi.fn(),
      getQueryParams: vi.fn(),
      updateQueryParams: vi.fn(),
      observeQueryParams: vi.fn(),
      container: document.createElement("div"),
    };

    const homeLink = link({
      text: "Home",
      path: "/",
      options: { className: "nav-link" },
    });

    expect(homeLink.tagName).toBe("A");
    expect(homeLink.textContent).toBe("Home");
    expect(homeLink.getAttribute("href")).toBe("/");
    expect(homeLink.className).toBe("nav-link");

    // Trigger click
    homeLink.click();
    expect(
      (window as unknown as { __urwaldRouter: Router }).__urwaldRouter.navigate
    ).toHaveBeenCalledWith("/");
  });
});
