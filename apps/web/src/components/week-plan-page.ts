/**
 * Week plan page — view and edit the weekly meal plan.
 * Custom element: <meal-week-plan-page>
 */

import { LitElement, html, css } from 'lit';

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

type SlWithValue = HTMLElement & { value: string };
type SlDialog = HTMLElement & { show(): void; hide(): void };

class WeekPlanPage extends LitElement {
  private _weekStart = getCurrentWeekStart();
  private _editingEntry: (Omit<MealPlanEntry, 'id'> & { id?: string }) | null = null;
  private _editingDate = '';
  private _editingMoment: MealMoment = MealMoment.dinner;
  private _editingEntryType: MealPlanEntryType = MealPlanEntryType.recipe;

  static override styles = css`
    :host {
      display: block;
      padding: 1rem;
      overflow-x: auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    h2 {
      margin: 0;
    }
    .week-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    table {
      border-collapse: collapse;
      min-width: 700px;
      width: 100%;
    }
    th,
    td {
      padding: 0.4rem 0.5rem;
      border: 1px solid #e0e0e0;
      vertical-align: middle;
      font-size: 0.9rem;
    }
    thead th {
      background: #f5f5f5;
      font-weight: 600;
      text-align: center;
      font-size: 0.8rem;
    }
    tbody th {
      background: #fafafa;
      font-weight: 500;
      width: 90px;
    }
    td {
      text-align: center;
    }
    .entry-label {
      font-size: 0.8rem;
      display: block;
      margin-bottom: 0.2rem;
    }
    .top-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
  `;

  protected override render(): unknown {
    const plan = service.getMealPlan(this._weekStart);
    const recipes = service.getRecipes();
    const freezerItems = service.getFreezerItems();
    const days = Array.from({ length: 7 }, (_, i) => shiftDate(this._weekStart, i));
    const moments = [MealMoment.breakfast, MealMoment.lunch, MealMoment.dinner, MealMoment.snack];
    const entries = plan?.entries ?? [];

    return html`
      <div class="header">
        <h2>Weekmenu</h2>
        <div class="week-nav">
          <sl-icon-button
            name="chevron-left"
            label="Vorige week"
            @click=${() => this._prevWeek()}
          ></sl-icon-button>
          <strong>
            ${formatShortDate(this._weekStart)} – ${formatShortDate(shiftDate(this._weekStart, 6))}
          </strong>
          <sl-icon-button
            name="chevron-right"
            label="Volgende week"
            @click=${() => this._nextWeek()}
          ></sl-icon-button>
        </div>
      </div>
      <div class="top-actions">
        <sl-button size="small" @click=${() => this._copyPrevWeek()}>
          Kopieer vorige week
        </sl-button>
        <sl-button size="small" variant="primary" @click=${() => this._generateShopping()}>
          Maak boodschappenlijst
        </sl-button>
      </div>
      <table>
        <thead>
          <tr>
            <th></th>
            ${days.map(
              (d, i) =>
                html`<th>
                  ${DAY_NAMES[i] ?? ''}<br /><span style="font-weight:400;">${d.slice(8)}</span>
                </th>`,
            )}
          </tr>
        </thead>
        <tbody>
          ${moments.map((moment) =>
            this._renderMomentRow(moment, days, entries, recipes, freezerItems),
          )}
        </tbody>
      </table>

      <sl-dialog id="entry-dialog" label="Maaltijdmoment">
        <sl-select
          id="ed-type"
          label="Type"
          value=${MealPlanEntryType.recipe}
          @sl-change=${(e: Event) => this._onTypeChange((e.target as SlWithValue).value)}
        >
          ${Object.entries(ENTRY_TYPE_LABELS).map(
            ([v, l]) => html`<sl-option value=${v}>${l}</sl-option>`,
          )}
        </sl-select>
        <br />
        <div ?hidden=${this._editingEntryType !== MealPlanEntryType.recipe}>
          <sl-select id="ed-recipe" label="Recept">
            ${recipes.length > 0
              ? recipes.map((r) => html`<sl-option value=${r.id}>${r.name}</sl-option>`)
              : html`<sl-option value="">— geen recepten —</sl-option>`}
          </sl-select>
        </div>
        <div ?hidden=${this._editingEntryType !== MealPlanEntryType.freezer}>
          <sl-select id="ed-freezer" label="Vriezeritem">
            ${freezerItems.length > 0
              ? freezerItems.map(
                  (f) => html`<sl-option value=${f.id}>${f.name ?? f.productId ?? ''}</sl-option>`,
                )
              : html`<sl-option value="">— geen items —</sl-option>`}
          </sl-select>
        </div>
        <sl-button slot="footer" variant="default" @click=${() => this._closeEntryDialog()}>
          Annuleren
        </sl-button>
        <sl-button slot="footer" variant="primary" @click=${() => this._saveEntry()}>
          Opslaan
        </sl-button>
      </sl-dialog>
    `;
  }

  private _renderMomentRow(
    moment: MealMoment,
    days: string[],
    entries: MealPlanEntry[],
    recipes: ReturnType<typeof service.getRecipes>,
    freezerItems: ReturnType<typeof service.getFreezerItems>,
  ): unknown {
    return html`
      <tr>
        <th>${MOMENT_LABELS[moment]}</th>
        ${days.map((date) => {
          const entry = entries.find((e) => e.date === date && e.moment === moment);
          if (entry) {
            let label = ENTRY_TYPE_LABELS[entry.type];
            if (entry.type === MealPlanEntryType.recipe && entry.recipeId) {
              label = recipes.find((r) => r.id === entry.recipeId)?.name ?? label;
            } else if (entry.type === MealPlanEntryType.freezer && entry.freezerItemId) {
              const fi = freezerItems.find((f) => f.id === entry.freezerItemId);
              label = fi?.name ?? fi?.productId ?? label;
            }
            return html`<td>
              <span class="entry-label">${label}</span>
              <sl-icon-button
                name="pencil"
                label="Bewerken"
                size="small"
                @click=${() => this._openEntryDialog(date, entry.moment, entry)}
              ></sl-icon-button>
              <sl-icon-button
                name="trash"
                label="Verwijderen"
                size="small"
                @click=${() => this._removeEntry(entry.id)}
              ></sl-icon-button>
            </td>`;
          }
          return html`<td>
            <sl-icon-button
              name="plus-circle"
              label="Toevoegen"
              size="small"
              @click=${() => this._openEntryDialog(date, moment, null)}
            ></sl-icon-button>
          </td>`;
        })}
      </tr>
    `;
  }

  private _prevWeek(): void {
    this._weekStart = shiftDate(this._weekStart, -7);
    this.requestUpdate();
  }

  private _nextWeek(): void {
    this._weekStart = shiftDate(this._weekStart, 7);
    this.requestUpdate();
  }

  private _copyPrevWeek(): void {
    const result = service.copyPreviousWeek(this._weekStart);
    if (result.copied) {
      this.requestUpdate();
    } else {
      alert('Geen vorige week gevonden.');
    }
  }

  private _generateShopping(): void {
    service.generateShoppingListFromCurrentPlan(this._weekStart, new Date().toISOString());
    alert('Boodschappenlijst aangemaakt!');
  }

  private _removeEntry(id: string): void {
    service.clearMealPlanEntry(this._weekStart, id);
    this.requestUpdate();
  }

  private _onTypeChange(type: string): void {
    this._editingEntryType = type as MealPlanEntryType;
    this.requestUpdate();
  }

  private _openEntryDialog(date: string, moment: MealMoment, entry: MealPlanEntry | null): void {
    this._editingDate = date;
    this._editingMoment = moment;
    this._editingEntry = entry ? { ...entry } : null;
    this._editingEntryType = entry?.type ?? MealPlanEntryType.recipe;
    this.requestUpdate();
    void this.updateComplete.then(() => {
      const typeSelect = this.shadowRoot!.getElementById('ed-type') as SlWithValue;
      const recipeSelect = this.shadowRoot!.getElementById('ed-recipe') as SlWithValue;
      const freezerSelect = this.shadowRoot!.getElementById('ed-freezer') as SlWithValue;
      typeSelect.value = this._editingEntryType;
      recipeSelect.value = entry?.recipeId ?? '';
      freezerSelect.value = entry?.freezerItemId ?? '';
      (this.shadowRoot!.getElementById('entry-dialog') as SlDialog).show();
    });
  }

  private _closeEntryDialog(): void {
    (this.shadowRoot!.getElementById('entry-dialog') as SlDialog).hide();
  }

  private _saveEntry(): void {
    const type = (this.shadowRoot!.getElementById('ed-type') as SlWithValue)
      .value as MealPlanEntryType;
    const recipeId =
      type === MealPlanEntryType.recipe
        ? (this.shadowRoot!.getElementById('ed-recipe') as SlWithValue).value
        : undefined;
    const freezerItemId =
      type === MealPlanEntryType.freezer
        ? (this.shadowRoot!.getElementById('ed-freezer') as SlWithValue).value
        : undefined;

    const entry: Omit<MealPlanEntry, 'id'> & { id?: string } = {
      date: this._editingDate,
      moment: this._editingMoment,
      type,
      quantity: 1,
      ...(this._editingEntry?.id !== undefined ? { id: this._editingEntry.id } : {}),
      ...(recipeId ? { recipeId } : {}),
      ...(freezerItemId ? { freezerItemId } : {}),
    };

    service.setMealPlanEntry(this._weekStart, entry);
    this._closeEntryDialog();
    this.requestUpdate();
  }
}

customElements.define('meal-week-plan-page', WeekPlanPage);
