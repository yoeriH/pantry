/**
 * Week plan page — view and edit the weekly meal plan.
 * Custom element: <meal-week-plan-page>
 */

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';

import type { MealPlanEntry } from '@pantry/domain';
import { MealMoment, MealPlanEntryType } from '@pantry/domain';
import { service } from '../services.js';
import {
  MOMENT_LABELS,
  ENTRY_TYPE_LABELS,
  getCurrentWeekStart,
  shiftDate,
  formatShortDate,
  DAY_NAMES,
} from '../labels.js';

class WeekPlanPage extends HTMLElement {
  private weekStart = getCurrentWeekStart();
  private editingEntry: (Omit<MealPlanEntry, 'id'> & { id?: string }) | null = null;
  private editingDate = '';
  private editingMoment: MealMoment = MealMoment.dinner;

  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  private render(): void {
    const shadow = this.shadowRoot!;
    const plan = service.getMealPlan(this.weekStart);
    const recipes = service.getRecipes();
    const freezerItems = service.getFreezerItems();

    // Build day dates array: Saturday through Friday (7 days)
    const days = Array.from({ length: 7 }, (_, i) => shiftDate(this.weekStart, i));

    // Build grid: moment × day
    const moments = [MealMoment.breakfast, MealMoment.lunch, MealMoment.dinner, MealMoment.snack];
    const entries = plan?.entries ?? [];

    const recipeOptions = recipes
      .map((r) => `<sl-option value="${r.id}">${escHtml(r.name)}</sl-option>`)
      .join('');
    const freezerOptions = freezerItems
      .map((f) => `<sl-option value="${f.id}">${escHtml(f.name ?? f.productId ?? '')}</sl-option>`)
      .join('');
    const typeOptions = Object.entries(ENTRY_TYPE_LABELS)
      .map(([v, l]) => `<sl-option value="${v}">${l}</sl-option>`)
      .join('');

    const grid = moments
      .map(
        (moment) => `
      <tr>
        <th>${MOMENT_LABELS[moment]}</th>
        ${days
          .map((date) => {
            const entry = entries.find((e) => e.date === date && e.moment === moment);
            if (entry) {
              let label = ENTRY_TYPE_LABELS[entry.type];
              if (entry.type === MealPlanEntryType.recipe && entry.recipeId) {
                label = recipes.find((r) => r.id === entry.recipeId)?.name ?? label;
              } else if (entry.type === MealPlanEntryType.freezer && entry.freezerItemId) {
                const fi = freezerItems.find((f) => f.id === entry.freezerItemId);
                label = fi?.name ?? fi?.productId ?? label;
              }
              return `<td>
              <span class="entry-label">${escHtml(label)}</span>
              <sl-icon-button name="pencil" label="Bewerken" size="small"
                data-action="edit-entry" data-id="${entry.id}" data-date="${date}" data-moment="${moment}">
              </sl-icon-button>
              <sl-icon-button name="trash" label="Verwijderen" size="small"
                data-action="remove-entry" data-id="${entry.id}" data-date="${date}">
              </sl-icon-button>
            </td>`;
            }
            return `<td>
            <sl-icon-button name="plus-circle" label="Toevoegen" size="small"
              data-action="add-entry" data-date="${date}" data-moment="${moment}">
            </sl-icon-button>
          </td>`;
          })
          .join('')}
      </tr>
    `,
      )
      .join('');

    shadow.innerHTML = `
      <style>
        :host { display: block; padding: 1rem; overflow-x: auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
        h2 { margin: 0; }
        .week-nav { display: flex; align-items: center; gap: 0.5rem; }
        table { border-collapse: collapse; min-width: 700px; width: 100%; }
        th, td { padding: 0.4rem 0.5rem; border: 1px solid #e0e0e0; vertical-align: middle; font-size: 0.9rem; }
        thead th { background: #f5f5f5; font-weight: 600; text-align: center; font-size: 0.8rem; }
        tbody th { background: #fafafa; font-weight: 500; width: 90px; }
        td { text-align: center; }
        .entry-label { font-size: 0.8rem; display: block; margin-bottom: 0.2rem; }
        .top-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      </style>
      <div class="header">
        <h2>Weekmenu</h2>
        <div class="week-nav">
          <sl-icon-button name="chevron-left" label="Vorige week" id="prev-week"></sl-icon-button>
          <strong>${escHtml(formatShortDate(this.weekStart))} – ${escHtml(formatShortDate(shiftDate(this.weekStart, 6)))}</strong>
          <sl-icon-button name="chevron-right" label="Volgende week" id="next-week"></sl-icon-button>
        </div>
      </div>
      <div class="top-actions" style="margin-bottom:1rem;">
        <sl-button id="copy-prev-btn" size="small">Kopieer vorige week</sl-button>
        <sl-button id="gen-shopping-btn" size="small" variant="primary">Maak boodschappenlijst</sl-button>
      </div>
      <table>
        <thead>
          <tr>
            <th></th>
            ${days.map((d, i) => `<th>${DAY_NAMES[i] ?? ''}<br><span style="font-weight:400;">${d.slice(8)}</span></th>`).join('')}
          </tr>
        </thead>
        <tbody>${grid}</tbody>
      </table>

      <sl-dialog id="entry-dialog" label="Maaltijdmoment">
        <sl-select id="ed-type" label="Type" value="${MealPlanEntryType.recipe}">
          ${typeOptions}
        </sl-select>
        <br>
        <div id="ed-recipe-section">
          <sl-select id="ed-recipe" label="Recept">
            ${recipeOptions || '<sl-option value="">— geen recepten —</sl-option>'}
          </sl-select>
        </div>
        <div id="ed-freezer-section" hidden>
          <sl-select id="ed-freezer" label="Vriezeritem">
            ${freezerOptions || '<sl-option value="">— geen items —</sl-option>'}
          </sl-select>
        </div>
        <sl-button slot="footer" variant="default" id="ed-cancel">Annuleren</sl-button>
        <sl-button slot="footer" variant="primary" id="ed-save">Opslaan</sl-button>
      </sl-dialog>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const shadow = this.shadowRoot!;

    shadow.getElementById('prev-week')?.addEventListener('click', () => {
      this.weekStart = shiftDate(this.weekStart, -7);
      this.render();
    });

    shadow.getElementById('next-week')?.addEventListener('click', () => {
      this.weekStart = shiftDate(this.weekStart, 7);
      this.render();
    });

    shadow.getElementById('copy-prev-btn')?.addEventListener('click', () => {
      const result = service.copyPreviousWeek(this.weekStart);
      if (result.copied) {
        this.render();
      } else {
        alert('Geen vorige week gevonden.');
      }
    });

    shadow.getElementById('gen-shopping-btn')?.addEventListener('click', () => {
      service.generateShoppingListFromCurrentPlan(this.weekStart, new Date().toISOString());
      alert('Boodschappenlijst aangemaakt!');
    });

    shadow.querySelectorAll('[data-action="add-entry"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const el = btn as HTMLElement;
        this.openEntryDialog(el.dataset['date']!, el.dataset['moment'] as MealMoment, null);
      });
    });

    shadow.querySelectorAll('[data-action="edit-entry"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const el = btn as HTMLElement;
        const plan = service.getMealPlan(this.weekStart);
        const entry = plan?.entries.find((e) => e.id === el.dataset['id']);
        if (entry) {
          this.openEntryDialog(el.dataset['date']!, entry.moment, entry);
        }
      });
    });

    shadow.querySelectorAll('[data-action="remove-entry"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const el = btn as HTMLElement;
        service.clearMealPlanEntry(this.weekStart, el.dataset['id']!);
        this.render();
      });
    });

    const typeSelect = shadow.getElementById('ed-type') as HTMLElement & { value: string };
    typeSelect?.addEventListener('sl-change', () => {
      this.toggleEntryDialogSections(typeSelect.value as MealPlanEntryType);
    });

    shadow.getElementById('ed-cancel')?.addEventListener('click', () => {
      this.closeEntryDialog();
    });

    shadow.getElementById('ed-save')?.addEventListener('click', () => {
      this.saveEntry();
    });
  }

  private toggleEntryDialogSections(type: MealPlanEntryType): void {
    const shadow = this.shadowRoot!;
    const recipeSection = shadow.getElementById('ed-recipe-section') as HTMLElement;
    const freezerSection = shadow.getElementById('ed-freezer-section') as HTMLElement;
    recipeSection.hidden = type !== MealPlanEntryType.recipe;
    freezerSection.hidden = type !== MealPlanEntryType.freezer;
  }

  private openEntryDialog(date: string, moment: MealMoment, entry: MealPlanEntry | null): void {
    this.editingDate = date;
    this.editingMoment = moment;
    this.editingEntry = entry ? { ...entry } : null;

    const shadow = this.shadowRoot!;
    const typeSelect = shadow.getElementById('ed-type') as HTMLElement & { value: string };
    const recipeSelect = shadow.getElementById('ed-recipe') as HTMLElement & { value: string };
    const freezerSelect = shadow.getElementById('ed-freezer') as HTMLElement & { value: string };

    const type = entry?.type ?? MealPlanEntryType.recipe;
    typeSelect.value = type;
    recipeSelect.value = entry?.recipeId ?? '';
    freezerSelect.value = entry?.freezerItemId ?? '';
    this.toggleEntryDialogSections(type);

    const dialog = shadow.getElementById('entry-dialog') as HTMLElement & { show(): void };
    dialog.show();
  }

  private closeEntryDialog(): void {
    const dialog = this.shadowRoot!.getElementById('entry-dialog') as HTMLElement & {
      hide(): void;
    };
    dialog.hide();
  }

  private saveEntry(): void {
    const shadow = this.shadowRoot!;
    const type = (shadow.getElementById('ed-type') as HTMLElement & { value: string })
      .value as MealPlanEntryType;
    const recipeId =
      type === MealPlanEntryType.recipe
        ? (shadow.getElementById('ed-recipe') as HTMLElement & { value: string }).value
        : undefined;
    const freezerItemId =
      type === MealPlanEntryType.freezer
        ? (shadow.getElementById('ed-freezer') as HTMLElement & { value: string }).value
        : undefined;

    const entry: Omit<MealPlanEntry, 'id'> & { id?: string } = {
      date: this.editingDate,
      moment: this.editingMoment,
      type,
      quantity: 1, // 1 = one full household meal (domain default)
      ...(this.editingEntry?.id !== undefined ? { id: this.editingEntry.id } : {}),
      ...(recipeId ? { recipeId } : {}),
      ...(freezerItemId ? { freezerItemId } : {}),
    };

    service.setMealPlanEntry(this.weekStart, entry);
    this.closeEntryDialog();
    this.render();
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

customElements.define('meal-week-plan-page', WeekPlanPage);
