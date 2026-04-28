/**
 * Dutch UI labels for domain enums.
 */

import { ProductCategory, Unit, MealMoment, MealPlanEntryType, PantryStatus } from '@pantry/domain';

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.groente_fruit]: 'Groente & Fruit',
  [ProductCategory.vlees_vis]: 'Vlees & Vis',
  [ProductCategory.zuivel]: 'Zuivel',
  [ProductCategory.houdbaar]: 'Houdbaar',
  [ProductCategory.diepvries]: 'Diepvries',
  [ProductCategory.brood]: 'Brood',
  [ProductCategory.drinken]: 'Drinken',
  [ProductCategory.huishouden]: 'Huishouden',
  [ProductCategory.cosmetica_deo]: 'Cosmetica & Deo',
  [ProductCategory.overige]: 'Overige',
};

export const UNIT_LABELS: Record<Unit, string> = {
  [Unit.gram]: 'gram',
  [Unit.kilogram]: 'kg',
  [Unit.milliliter]: 'ml',
  [Unit.liter]: 'liter',
  [Unit.stuk]: 'stuk',
  [Unit.zak]: 'zak',
  [Unit.pak]: 'pak',
  [Unit.blik]: 'blik',
  [Unit.fles]: 'fles',
  [Unit.pot]: 'pot',
};

export const MOMENT_LABELS: Record<MealMoment, string> = {
  [MealMoment.breakfast]: 'Ontbijt',
  [MealMoment.lunch]: 'Lunch',
  [MealMoment.dinner]: 'Avondeten',
  [MealMoment.snack]: 'Snack',
};

export const ENTRY_TYPE_LABELS: Record<MealPlanEntryType, string> = {
  [MealPlanEntryType.recipe]: 'Recept',
  [MealPlanEntryType.open]: 'Nog open',
  [MealPlanEntryType.eating_elsewhere]: 'Ergens anders eten',
  [MealPlanEntryType.ordering_food]: 'Eten bestellen',
  [MealPlanEntryType.freezer]: 'Uit vriezer',
};

export const PANTRY_STATUS_LABELS: Record<PantryStatus, string> = {
  [PantryStatus.in_house]: 'Op voorraad',
  [PantryStatus.possibly_running_out]: 'Mogelijk bijna op',
  [PantryStatus.out]: 'Op',
};

export const DAY_NAMES = ['za', 'zo', 'ma', 'di', 'wo', 'do', 'vr'];

/** Add `days` to an ISO date string (YYYY-MM-DD) and return a new date string. */
export function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Return the Saturday that starts the current week. */
export function getCurrentWeekStart(): string {
  const today = new Date();
  const day = today.getDay(); // 0=Sun, 6=Sat
  // Days to subtract to reach the most recent Saturday:
  //   Sat(6)→0, Sun(0)→1, Mon(1)→2, …, Fri(5)→6
  const daysBack = (day + 1) % 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() - daysBack);
  return sat.toISOString().slice(0, 10);
}

/** Format an ISO date string as a short Dutch date (e.g. "za 26 apr"). */
export function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return d.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}
