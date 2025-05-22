## Router Enhancement Spec

### 1. Query Parameter Support

```typescript
// Enhanced Router interface
export interface Router {
  container: HTMLElement;
  navigate: (
    path: string,
    queryParams?: Record<string, string | number | boolean | string[]>
  ) => void;
  getQueryParams: () => Record<string, string>;
  updateQueryParams: (
    params: Record<string, string | number | boolean | string[]>
  ) => void;
}
```

Key functionality:

- Parse query parameters from URL on initial load and navigation
- Allow navigating with query params: `router.navigate('/products', { category: 'electronics' })`
- Provide a way to access current query params: `const params = router.getQueryParams()`
- Support updating just query params without changing the route: `router.updateQueryParams({ sort: 'price' })`
- Handle serialization of complex values (arrays, objects, etc.)

#### Potentially Reactive approach

The reactive approach for search params is an excellent idea. It would integrate nicely with your existing state system. We could create a reactive state object for the URL params that automatically updates when:

1. The URL changes via navigation
2. Browser history events occur (back/forward)
3. Query params are updated via the API

Components could then subscribe to these changes just like your existing state pattern:

```typescript
// Conceptual example
router.observeParams((params) => {
  console.log("Query params changed:", params);
  // Update UI accordingly
});
```

This reactive model fits perfectly with your library's philosophy and would provide a seamless experience similar to React Router but with your lightweight approach.

### 2. Route Parameters

```typescript
// Route definition with parameters
export interface RouteDefinition {
  [path: string]: (params: RouteParams) => RouteElement;
}

// Route parameters object
export interface RouteParams {
  path: Record<string, string>;
  query: Record<string, string>;
}
```

Support for path parameters:

- Define routes with params: `'/products/:id'`
- Access params in component: `(params) => { const productId = params.path.id; ... }`
- Match patterns like `/products/123` to `/products/:id`

### 3. Navigation Guards

```typescript
export type NavigationGuard = (
  to: { path: string; params: RouteParams },
  from: { path: string; params: RouteParams }
) => boolean | string;
```

- Allow prevention of navigation based on conditions
- Support redirects (return a different path)
- Run guards before navigation occurs

### 4. History State Management

- Support for preserving and restoring scroll position
- Allow passing state object to `pushState`
- Make state available to route components

### 5. Route Organization

- Support for nested routes
- Group routes by feature or section
- Middleware for routes (authentication, logging, etc.)

This provides a comprehensive roadmap for evolving your router while maintaining the clean DX you've established. The query parameter support would be the most immediately useful feature to implement.
