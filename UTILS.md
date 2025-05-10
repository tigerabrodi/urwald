Let me walk through how users would practically use these utility functions with your existing framework:

### List Rendering

```typescript
// User has a state with items
const todoListState = state({
  items: [
    { id: 1, text: "Buy milk", completed: false },
    { id: 2, text: "Write code", completed: true },
  ],
});

// In their UI code:
const todoList = el("ul")
  .add(
    renderList(
      () => todoListState.state.items,
      (item) =>
        el("li")
          .class(item.completed ? "completed" : "")
          .text(item.text)
          .on("click", () => toggleTodo(item.id))
          .done()
    )
  )
  .done();

// When state changes (items added/removed/updated), the list automatically updates
```

### Conditional Rendering

```typescript
const authState = state({ isLoggedIn: false, user: null });

const app = el("div")
  .add(
    when(
      () => authState.state.isLoggedIn,
      el("div")
        .class("dashboard")
        .text(() => `Welcome, ${authState.state.user?.name}`)
        .done(),
      // Optional else branch
      el("div").class("login-form").add(/* login elements */).done()
    )
  )
  .done();

// Later, on login:
authState.update((s) => {
  s.isLoggedIn = true;
  s.user = { name: "John", role: "admin" };
  return s;
});
// The UI automatically switches from login form to dashboard
```

### Debounce/Throttle

```typescript
const searchState = state({ query: "", results: [] });

// Search input with debounced updates
const searchInput = el("input")
  .attr({ type: "text", placeholder: "Search..." })
  .on(
    "input",
    debounce((e) => {
      const query = e.target.value;
      searchState.update((s) => {
        s.query = query;
        return s;
      });
      fetchSearchResults(query);
    }, 300)
  ) // Only trigger search 300ms after typing stops
  .done();
```

### DOM Helpers

```typescript
const themeState = state({ isDarkMode: false });

// Instead of manual class management:
const toggleTheme = () => {
  themeState.update((s) => {
    s.isDarkMode = !s.isDarkMode;
    return s;
  });

  // Automatically update classes based on state
  toggleClass(document.body, "dark-theme", themeState.state.isDarkMode);
};

// Or with a reactive approach:
effect(() => {
  toggleClass(document.body, "dark-theme", themeState.state.isDarkMode);
});
```

### Computed Values

```typescript
const cartState = state({
  items: [
    { id: 1, name: "Product A", price: 10, quantity: 2 },
    { id: 2, name: "Product B", price: 15, quantity: 1 },
  ],
});

// Create a computed value for cart total
const cartTotal = computed(cartState, (state) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// Use in UI
const totalElement = el("div")
  .text(() => `Total: $${cartTotal()}`)
  .done();

// When items are added/removed or quantities changed, total updates automatically
cartState.update((s) => {
  s.items[0].quantity = 3;
  return s;
});
// totalElement now shows "Total: $45"
```

These utilities would make common patterns significantly easier to implement while maintaining the lightweight, reactive approach of your framework.
