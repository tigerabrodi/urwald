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
