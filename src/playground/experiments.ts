import { el } from "../el";

const _searchInput = el("input")
  .on("input", (event) => {
    console.log((event.target as HTMLInputElement).value);
  })
  .done();
