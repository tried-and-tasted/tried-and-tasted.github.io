# Tried & Tasted

Recipes that work for me — cooked, adjusted and written down. Published at https://tried-and-tasted.github.io.

## Adding a recipe

Add a YAML file to `recipes/`. The file name becomes the page address (`recipes/butter-chicken.yaml` → `/recipes/butter-chicken/`).

```yaml
title: "Butter Chicken"
tags: [North Indian, Curry]
servings: 2
ingredients:
  - name: "chicken thighs, boneless"
    amount: 307
    unit: "g"
  - name: "cloves"
    amount: 2        # no unit for things you count
instructions:
  - "Marinate: Cut the chicken into chunks..."   # "Heading: text" shows the heading in bold
```

Every `amount` must be a number so the servings scaler works; the build fails and names the file if one isn't.

Measuring conventions:
- **Main ingredient** in a round number — 300 g chicken, not 307 g.
- **Oil, ghee and butter** in grams (1 tbsp oil ≈ 14 g). For oils the page also shows the spoons and ml, e.g. `30 g` → `2 tbsp · 33 ml`.
- **Spices, salt and sugar** in tsp/tbsp, never grams — spoons are what you measure with. Fresh ginger, garlic and chillies stay in grams or counts.
- Keep ingredient names plain (`oil`, not `oil (coconut or sesame preferred)`); put the choice in the step if it matters.

Tags used for the filters — Cuisine: South Indian, North Indian, Indian, International. Dish: Curry, Rice, Soup, Pasta & Noodles, Breakfast, Bread, Main, Side, Chutney, Snack, Sweet, Drink. Method & diet: Pressure cooker, Air fryer, Vegetarian.

## Running it

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

## Tests

```sh
npx playwright install chromium   # once
npm test
```

The end-to-end tests in `e2e/` build the site and open it in Chrome at desktop and phone sizes: every recipe page must load with valid amounts and no browser errors, and search, filters, the servings scaler and ticking off ingredients must work.

Pushing to `main` runs the tests and publishes the site through GitHub Actions (`.github/workflows/deploy.yml`) only if they all pass. Pull requests are tested but not published.
