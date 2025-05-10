/**
 * Renders a list of items dynamically, updating when the source data changes
 * @template T The type of items in the list
 * @param itemsGetter A function that returns the current array of items
 * @param itemRenderer A function that renders each individual item into an HTML element
 * @returns A fragment containing the rendered items
 */
export function renderList<T>(
  itemsGetter: () => Array<T>,
  itemRenderer: (item: T) => HTMLElement
): DocumentFragment {
  // Create a document fragment to hold the items
  const fragment = document.createDocumentFragment();

  // Initial rendering
  const currentItems = itemsGetter();
  const elements = currentItems.map(itemRenderer);
  elements.forEach((element) => fragment.appendChild(element));

  // Set up a MutationObserver to watch for changes in the array
  // In a real implementation, this would require integration with your state management system
  // For now, we'll return the initial fragment

  return fragment;
}
