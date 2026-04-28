# Pantry Product Spec

> Source of truth for what Pantry is and what it should do.
> Audience: future implementers and agentic development prompts.
> This document describes product behavior. It does not prescribe code, types, or APIs.
> For architecture and tech choices, see [`docs/architecture.md`](docs/architecture.md).
> For agent operating rules, see [`AGENTS.md`](AGENTS.md).

---

## 1. Purpose

Pantry is a Dutch web app for a single household. It helps the family decide:

- **what to eat** this week,
- **what is in the house** (voorraad and vriezer),
- **what may be running out**, and
- **what to put on the shopping list**.

The app must be simple, reliable, mobile-friendly, and useful during the weekly grocery flow. The product UI language is **Dutch**.

The first version may be single-user/shared-session household use. Storage is browser-local. A future migration to a Node.js backend with Neon/Postgres is planned (see `docs/architecture.md`).

---

## 2. Primary user scenario

It is **Saturday** and the household wants to do groceries.

The user can:

1. Open Pantry.
2. See suggested products that may be running out.
3. Review and correct these suggestions.
4. Create or update the week menu (Saturday → Friday).
5. For each meal slot, choose: known recipe, freezer portion, open/undecided, ordering food, or eating elsewhere.
6. Generate a shopping list from voorraad + recipes.
7. Resolve uncertain ("misschien nodig") items.
8. Use the shopping list on a phone in the supermarket.
9. Check items off while shopping.
10. Complete the shopping trip.
11. Checked items update pantry status and purchase history.
12. Unchecked items remain on the active list and do **not** update pantry status.

This Saturday flow is the most important flow in the product.

---

## 3. MVP scope

The MVP must include:

- Pantry status tracking (per product, not exact stock counts).
- Product categories.
- Purchase history (from completed shopping trips).
- Simple purchase prediction (based on average interval of last 3 purchases).
- Manual status override per product.
- Recipe management with structured ingredients and units.
- Week menu, Saturday through Friday, with multiple meal moments.
- Freezer portions (prepared meals + loose freezer products).
- Shopping list generation from voorraad + week menu + manual additions.
- "Maybe-needed" resolution before shopping.
- Mobile-first shopping view.
- Shopping completion flow.
- Pantry and purchase-history update after completion.
- Shopping history.
- Local browser storage.

---

## 4. Non-goals

The MVP intentionally does **not** include:

- Barcode scanning.
- Price comparison.
- Store-specific routing or store-specific lists.
- Expiration date / THT tracking.
- Nutrition tracking.
- Advanced AI meal recommendations.
- Complex stock prediction based on package size or quantity math.
- Multi-household sync, login, or accounts.
- Recipe preparation steps.

These are not forbidden forever — see [§10 Future roadmap](#10-future-roadmap).

---

## 5. Core concepts

### 5.1 Pantry status

Pantry (voorraad) tracks **status per product**, not exact counts.

**Product statuses:**

- `in huis / genoeg` — in house, enough.
- `mogelijk op / bijna op` — possibly running out, maybe needed.
- `op` — out.

**Pantry areas / categories:**

- `voorraadkast`
- `koelkast`
- `vriezer` (see [§5.6](#56-freezer))
- `huishouden`
- `cosmetica/deo`
- `overige`

**Voorraad view:**

- Lists products grouped by area.
- Shows a clear icon for "mogelijk op" items.
- "Mogelijk op" must be filterable as its own view.
- "Mogelijk op" items must also be shown prominently when creating/reviewing a shopping list.

**Quick status override:**

Users must be able to set status in one tap from voorraad view:

- `genoeg / in huis`
- `bijna op / mogelijk op`
- `op`

### 5.2 Purchase behavior

Purchase history drives prediction. The rules must be simple and reliable.

**What counts as a purchase:**

- Only items that were **checked on the shopping list** _and_ the **shopping trip was completed**.
- Skipped or unchecked items do not count, regardless of intent.

**Prediction:**

- Use the **average interval of the last 3 purchases** for that product.
- Suggest the item slightly **before** it is expected to run out.
- Do not attempt complex quantity-based inventory prediction.
- The household buys consistent package sizes; the app does not need to model bulk-size differences.

**Temporary adjustment for the current prediction/check:**

- `gaat sneller op` → suggest 25% earlier.
- `normaal` → no adjustment.
- `gaat langzamer op` → suggest 25% later.

This adjustment applies to the current prediction, not as a permanent product setting.

**Reset:**

- Each product must have a "reset koopgeschiedenis" action that clears its purchase history.

### 5.3 Recipes

A recipe has:

- name,
- ingredient list,
- structured units (see [§5.4](#54-units-and-aggregation)),
- tags.

**Out of scope for MVP:** preparation steps.

**Quantities:**

- Recipes are entered as **family portions**.
- One recipe quantity = one full household meal.
- A meal-plan quantity of `2` means cooking/eating that recipe for two household meals/days.

**Editing:**

- Recipes support duplication and editing.
- Ingredients are selected via a **product search combobox**.
- If no product matches, the user can **add a new product** inline.
- The app does not understand product equivalence (e.g. cherry tomaten vs. tomaten). The user manages this manually.

**Ingredient metadata** (per ingredient, per recipe):

- normal pantry item,
- usually buy fresh,
- optional,
- replaceable,
- maybe-needed behavior (contributes as "misschien nodig" rather than a guaranteed list item).

### 5.4 Units and aggregation

Units are **structured**, not free text.

**Supported units (MVP):**

- `gram`
- `kilogram`
- `milliliter`
- `liter`
- `stuk`
- `zak`
- `pak`
- `blik`
- `fles`
- `pot`

**Aggregation rules on the shopping list:**

- Same product + same unit → aggregated into a single line.
- Different units for the same product → **not** mathematically merged.
- When aggregated, the list shows the composition underneath the line.

**Example (same unit, aggregated):**

```
Uien — 3 stuks
  • Chili — 1 stuk
  • Pasta — 2 stuks
```

**Example (different units, visually grouped, not summed):**

```
Tomaten
  • Saus: 500 gram
  • Salade: 2 stuks
```

The app may visually group different units under the same product, but must not pretend it can compute a combined quantity.

### 5.5 Week menu

- Planning week runs **Saturday through Friday**.
- Multiple meal moments per day:
  - `ontbijt` (breakfast)
  - `lunch`
  - `avondeten` (dinner)
  - `tussendoor` (snacks)
- Each meal slot is one of:
  - **recipe** — pulls ingredients into the shopping list.
  - **open / nog niet beslist** — undecided. **Does not** mean "no groceries needed".
  - **buiten de deur eten** — eating elsewhere. No groceries generated.
  - **eten bestellen** — ordering food. No groceries generated.
  - **vriezerportie** — freezer meal. Uses a freezer portion. No recipe groceries generated.
- The user can **copy the previous week** as a starting point.
- The user can **add freezer portions from the week menu overview** after cooking (e.g. "we hebben extra chili gemaakt, zet 2 porties in de vriezer").

### 5.6 Freezer

The freezer (`vriezer`) tracks **portions**, unlike normal voorraad.

- One freezer portion = one portion **for the whole household**.
- Freezer supports two kinds of items:
  - **prepared meals** — e.g. chili, pastasaus, curry.
  - **loose freezer products** — e.g. brood, kip, groenten.

**Behavior:**

- When a freezer portion is selected for a meal slot:
  - **decrement** the available portions for that item,
  - **do not** generate groceries for that meal,
  - the UI suggests available freezer meals/products when picking the slot.
- The user can add portions manually (after cooking, after a freezer-aware shopping trip, etc.).

### 5.7 Shopping list

The shopping list (`boodschappenlijst`) has its own view. It is **mobile-first** and must be usable one-handed in the supermarket.

- It is **one shared household list**.
- It is used across multiple stores, but there is **no store-specific logic** in MVP.
- Items are **grouped by category** (see [§7](#7-categories)).
- Items can be checked / unchecked.
- Items can be **drag-and-drop reordered within a category**.
- Users can quickly add **manual items** (free entry, choosing category + unit).

**Each shopping-list item can show:**

- product,
- quantity + unit,
- category,
- source:
  - `voorraad` — added because pantry status is "op" or "mogelijk op",
  - `recept` — added by a week-menu recipe,
  - `handmatig` — added manually,
- uncertainty / "misschien nodig" state,
- composition (when multiple sources aggregated into one line; see [§5.4](#54-units-and-aggregation)).

**Maybe-needed items:**

- Must be visibly distinct (inline marker and/or a "misschien nodig" section).
- For each maybe-needed item the user must be able to:
  - **toevoegen aan lijst**, or
  - **overslaan**.

**Completing a shopping trip:**

- Checked items → update pantry status (typically to `in huis / genoeg`) and append to purchase history.
- Unchecked items → remain on the active list, **do not** update pantry status, **do not** count as purchased.
- The completed trip is stored in shopping history with date, checked items, and unchecked/skipped items.

### 5.8 History

The app keeps shopping history.

History shows:

- date of the trip,
- which items were checked (purchased),
- which items were skipped or left unchecked,
- the previous shopping lists in their final state.

Purchase-behavior predictions ([§5.2](#52-purchase-behavior)) use **completed checked purchases only**.

---

## 6. Key user flows

### 6.1 Saturday grocery flow

End-to-end weekly flow. See [§2](#2-primary-user-scenario) for the full step-by-step.
This flow is the product's north star: every other feature exists to support it.

### 6.2 Recipe-to-shopping-list flow

1. User plans a recipe in a meal slot of the week menu, with quantity N (default 1 = one household meal).
2. The app expands recipe ingredients × N.
3. Each ingredient becomes a shopping-list candidate, applying its ingredient metadata:
   - normal pantry item — only added if voorraad says `op` or `mogelijk op`,
   - usually buy fresh — always added,
   - optional — not auto-added,
   - replaceable — added but flagged as replaceable,
   - maybe-needed — added in "misschien nodig" state.
4. Same product + same unit aggregates across recipes ([§5.4](#54-units-and-aggregation)).
5. The user reviews the list before shopping.

### 6.3 Freezer meal flow

1. User picks `vriezerportie` for a meal slot.
2. The app suggests available freezer meals/products (those with portions > 0).
3. User selects one.
4. No groceries are generated for that slot.
5. When the meal is consumed, the freezer portion count decrements.
6. After cooking a new batch, the user can add portions back from the week menu overview or the vriezer view.

### 6.4 Shopping completion flow

1. User opens the shopping list on a phone in the store.
2. User checks items as they go in the cart.
3. User taps **"boodschappen afronden"**.
4. Checked items:
   - update pantry status (`in huis / genoeg`),
   - are added to purchase history with the trip's completion date.
5. Unchecked items:
   - stay on the active list,
   - do **not** update pantry status,
   - do **not** count as purchased.
6. The completed trip is appended to shopping history ([§5.8](#58-history)).

### 6.5 Purchase prediction correction flow

1. While reviewing the shopping list (or a "mogelijk op" suggestion), the user sees a predicted item.
2. The user can adjust this **single occurrence**:
   - `gaat sneller op` (suggest 25% earlier),
   - `normaal`,
   - `gaat langzamer op` (suggest 25% later).
3. The adjustment applies to the current prediction/check only and does not become a permanent product setting.
4. If the prediction is consistently wrong, the user can **reset koopgeschiedenis** for that product ([§5.2](#52-purchase-behavior)).

---

## 7. Categories

MVP product categories (used for grouping in the voorraad and the shopping list):

- `Groente/Fruit`
- `Vlees/Vis`
- `Zuivel`
- `Houdbaar`
- `Diepvries`
- `Brood`
- `Drinken`
- `Huishouden`
- `Cosmetica/deo`
- `Overige`

Pantry areas ([§5.1](#51-pantry-status)) are about **where it lives in the house** (voorraadkast, koelkast, …). Product categories above are about **how it groups on a shopping list**. The two are related but not identical.

---

## 8. Decision rules

These are the rules the app must follow when generating suggestions:

1. A "mogelijk op" voorraad item is a shopping-list candidate.
2. A predicted-running-out item (per [§5.2](#52-purchase-behavior)) is a shopping-list candidate.
3. A recipe ingredient is a shopping-list candidate based on its metadata ([§6.2](#62-recipe-to-shopping-list-flow)).
4. A freezer-portion meal slot does **not** generate groceries.
5. An "eating elsewhere" or "ordering food" slot does **not** generate groceries.
6. An "open" slot does **not** generate groceries on its own, but the user is reminded it is unresolved.
7. Manual additions are always added as-is.
8. Same product + same unit → one aggregated line with composition shown.
9. Same product + different units → grouped visually only; no math.
10. Only checked items in a completed trip update pantry status and purchase history.
11. The temporary "sneller / normaal / langzamer" adjustment applies to the current prediction only.

---

## 9. UX principles

- **Simple beats smart.** Prefer rules a user can predict over models they can't.
- **Reliable beats magical.** Wrong-but-confident suggestions destroy trust.
- **Explainable.** The user must understand _why_ an item appears on the list (voorraad / recept / handmatig / misschien nodig).
- **Fast correction.** Overriding pantry status or removing a suggestion must take one or two taps.
- **One-handed shopping mode.** The shopping list must be readable and tappable one-handed on a phone.
- **Dutch household language.** UI copy uses everyday Dutch household terms (voorraad, vriezer, boodschappen, mogelijk op, etc.).
- **Avoid inventory math** unless it is genuinely reliable. If we can't be sure, show "misschien nodig".
- **Saturday is the priority.** When in doubt, optimize for the Saturday grocery flow.
- **Reduce forgotten groceries** — but **don't become an admin burden**. Bookkeeping the user wouldn't otherwise do is suspect.

---

## 10. Future roadmap

These are explicitly out of scope for MVP, but are anticipated directions:

- Backend API replacing local storage (see `docs/architecture.md`).
- Neon / Postgres persistence.
- Multi-device household sync.
- Login / accounts.
- Store-specific shopping lists or aisle ordering.
- Recipe preparation steps.
- Richer prediction model (seasonality, multi-product correlation).
- Import / export of recipes, voorraad, history.
- Optional AI-assisted suggestions (meal ideas, "you usually buy this on Saturdays", etc.).

---

## 11. Glossary

| Dutch term                    | Meaning in Pantry                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Voorraad                      | Pantry — the set of products the household tracks status for.                        |
| Voorraadkast                  | Pantry cupboard area.                                                                |
| Koelkast                      | Fridge area.                                                                         |
| Vriezer                       | Freezer; tracks **portions**, not just status.                                       |
| Huishouden                    | Household supplies area (cleaning, paper, etc.).                                     |
| Cosmetica/deo                 | Personal care area.                                                                  |
| Overige                       | Catch-all area / category.                                                           |
| Genoeg / in huis              | Status: enough in the house.                                                         |
| Mogelijk op / bijna op        | Status: possibly running out, candidate for shopping list.                           |
| Op                            | Status: out.                                                                         |
| Misschien nodig               | "Maybe needed" — uncertain shopping-list state requiring user resolution.            |
| Weekmenu                      | The Saturday-through-Friday meal plan with breakfast / lunch / dinner / snack slots. |
| Vriezerportie                 | One freezer portion = one whole-household portion.                                   |
| Recept                        | Recipe; expressed in family portions, with structured ingredients and units.         |
| Boodschappenlijst             | Shopping list; one shared household list, mobile-first.                              |
| Boodschappen afronden         | Completing a shopping trip — checked items update voorraad and purchase history.     |
| Koopgedrag / koopgeschiedenis | Purchase history derived from completed shopping trips.                              |
| Gaat sneller / langzamer op   | Temporary one-shot adjustment of a prediction (±25%).                                |
| Handmatig                     | Source label: item added manually, not from voorraad or a recipe.                    |

---

_This spec describes product behavior only. Domain models, types, APIs, and component structure are intentionally not specified here and will be defined when each feature is implemented._
