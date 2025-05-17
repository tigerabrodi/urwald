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
