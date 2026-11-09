// Home page search and tag filters, shared by the page and the unit tests.

// Filter chips, grouped so choices within a group widen the list and across groups narrow it
export const TAG_GROUPS: [string, string[]][] = [
  ['Cuisine', ['South Indian', 'North Indian', 'Indian', 'International']],
  ['Dish', ['Curry', 'Rice', 'Soup', 'Pasta & Noodles', 'Breakfast', 'Bread', 'Main', 'Side', 'Chutney', 'Snack', 'Sweet', 'Drink']],
  ['Method & diet', ['Pressure cooker', 'Air fryer', 'Vegetarian']],
];

export const searchWords = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

// searchText: lower-cased title, tags and ingredient names. selected: chosen tags per group.
export function matchesFilters(searchText: string, tags: string[], words: string[], selected: string[][]): boolean {
  return (
    words.every((word) => searchText.includes(word)) &&
    selected.every((group) => group.length === 0 || group.some((tag) => tags.includes(tag)))
  );
}
