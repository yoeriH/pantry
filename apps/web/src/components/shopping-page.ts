/**
 * Shopping page — active shopping list management.
 * Custom element: <meal-shopping-page>
 *
 * UX design goals:
 * - One-handed mobile use with large (≥ 56 px) tap targets.
 * - Tap anywhere on an item row to check / uncheck.
 * - Certain items grouped by category with sticky headers.
 * - Maybe-needed items in a distinct top section with 1-tap ✔/✖ actions.
 * - Inline completion confirmation — no browser confirm() dialog.
 * - Item meta-line shows quantity + unit + source labels.
 */

import { LitElement, html, css, nothing } from 'lit';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';

import type {
  ProductCategory,
  Recipe,
  ShoppingListItem,
  ShoppingListItemSource,
  Unit,
} from '@pantry/domain';
import { service } from '../services.js';
import { CATEGORY_LABELS, UNIT_LABELS, getCurrentWeekStart } from '../labels.js';

type SlWithValue = HTMLElement & { value: string };
type SlDialog = HTMLElement & { show(): void; hide(): void };

/** Resolve a source entry to a short Dutch display label. */
function sourceLabel(source: ShoppingListItemSource, recipeMap: Map<string, Recipe>): string {
  if (source.type === 'recipe') {
    if (source.referenceId) {
      return recipeMap.get(source.referenceId)?.name ?? source.note ?? 'recept';
    }
    return source.note ?? 'recept';
  }
  if (source.type === 'pantry') return 'voorraad';
  return 'handmatig';
}

class ShoppingPage extends LitElement {
  /** Controls the inline completion-confirmation panel. */
  private _showCompleteConfirm = false;

  static override styles = css`
    :host {
      display: block;
      padding: 0.75rem;
      max-width: 600px;
      margin: 0 auto;
    }
    h2 {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
    }

    /* ── Top bar ── */
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .item-count {
      font-size: 0.9rem;
      color: #555;
      font-weight: 500;
    }
    .top-bar-actions {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    /* ── Category headers ── */
    .category-header {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #666;
      padding: 0.6rem 0 0.2rem;
      position: sticky;
      top: 0;
      background: #fff;
      z-index: 1;
    }
    .checked-header {
      color: #aaa;
    }
    .section-divider {
      height: 1px;
      background: #e8e8e8;
      margin: 0.5rem 0;
    }

    /* ── Certain items ── */
    .list-item {
      display: flex;
      align-items: center;
      min-height: 56px;
      padding: 0.5rem 0.25rem;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      gap: 0.65rem;
      user-select: none;
      border-radius: 4px;
      transition: background 0.1s;
      -webkit-tap-highlight-color: transparent;
    }
    .list-item:active,
    .list-item:focus-visible {
      background: #f5f5f5;
      outline: none;
    }
    .list-item.checked {
      opacity: 0.45;
    }
    .list-item.checked .item-name {
      text-decoration: line-through;
      color: #999;
    }

    .check-circle {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border: 2px solid #ccc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition:
        background 0.15s,
        border-color 0.15s;
    }
    .check-circle.is-checked {
      background: #22c55e;
      border-color: #22c55e;
    }
    .check-circle svg {
      width: 12px;
      height: 12px;
    }

    .item-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .item-name {
      font-weight: 500;
      font-size: 1rem;
      line-height: 1.3;
    }
    .item-meta {
      font-size: 0.78rem;
      color: #888;
      white-space: normal;
      line-height: 1.4;
    }

    /* ── Maybe-needed section ── */
    .maybe-section {
      background: #fffbea;
      border: 1px solid #f5d76e;
      border-radius: 8px;
      padding: 0.5rem 0.75rem 0.25rem;
      margin-bottom: 1rem;
    }
    .maybe-section-title {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #92610a;
      padding-bottom: 0.4rem;
      margin-bottom: 0.25rem;
      border-bottom: 1px solid #f5d76e;
    }
    .maybe-item {
      display: flex;
      align-items: center;
      min-height: 56px;
      padding: 0.4rem 0;
      border-bottom: 1px solid #f5d76e40;
      gap: 0.65rem;
    }
    .maybe-item:last-child {
      border-bottom: none;
    }
    .maybe-actions {
      display: flex;
      gap: 0.4rem;
      flex-shrink: 0;
    }
    .maybe-btn {
      min-width: 58px;
      min-height: 44px;
      font-size: 0.85rem;
      font-weight: 600;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      padding: 0 0.6rem;
      transition: filter 0.1s;
      -webkit-tap-highlight-color: transparent;
    }
    .maybe-btn:active {
      filter: brightness(0.88);
    }
    .maybe-add {
      background: #dcfce7;
      color: #166534;
    }
    .maybe-skip {
      background: #f3f4f6;
      color: #374151;
    }

    /* ── Inline completion confirmation ── */
    .confirm-panel {
      background: #fff7ed;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 0.75rem;
    }
    .confirm-title {
      font-weight: 700;
      margin-bottom: 0.3rem;
    }
    .confirm-body {
      font-size: 0.85rem;
      color: #555;
      margin-bottom: 0.75rem;
    }
    .confirm-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* ── All-done banner ── */
    .all-done-banner {
      background: #dcfce7;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
      font-weight: 500;
      color: #166534;
      margin-bottom: 0.75rem;
      text-align: center;
    }

    /* ── Empty states ── */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 0.75rem;
    }
    .empty-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }
    .empty-sub {
      font-size: 0.9rem;
      color: #888;
      margin-bottom: 1.25rem;
    }
  `;

  protected override render(): unknown {
    const activeList = service.getActiveShoppingList();
    const products = service.getProducts();
    const recipes = service.getRecipes();
    const productMap = new Map(products.map((p) => [p.id, p]));
    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    const categoryOptions = Object.entries(CATEGORY_LABELS).map(
      ([v, l]) => html`<sl-option value=${v}>${l}</sl-option>`,
    );
    const unitOptions = Object.entries(UNIT_LABELS).map(
      ([v, l]) => html`<sl-option value=${v}>${l}</sl-option>`,
    );

    if (!activeList) {
      return html`
        <h2>Boodschappen</h2>
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <p class="empty-title">Geen boodschappenlijst</p>
          <p class="empty-sub">Genereer een lijst op basis van het weekmenu.</p>
          <sl-button variant="primary" size="large" @click=${() => this._generate()}>
            Genereer boodschappenlijst
          </sl-button>
        </div>
        ${this._manualItemDialog(categoryOptions, unitOptions)}
      `;
    }

    const items = activeList.items;
    const maybeItems = items.filter((i) => i.uncertainty === 'maybe_needed');
    const certainUnchecked = items.filter(
      (i) => i.uncertainty === 'certain' && i.status === 'unchecked',
    );
    const certainChecked = items.filter(
      (i) => i.uncertainty === 'certain' && i.status === 'checked',
    );

    const renderMeta = (item: ShoppingListItem): string => {
      const unit = UNIT_LABELS[item.unit] ?? item.unit;
      const sources = [...new Set(item.sources.map((s) => sourceLabel(s, recipeMap)))].join(', ');
      return `${item.quantity}\u00a0${unit}${sources ? ` · ${sources}` : ''}`;
    };

    // Group unchecked certain items by category in CATEGORY_LABELS order
    const byCategory = new Map<ProductCategory, ShoppingListItem[]>();
    for (const item of certainUnchecked) {
      const arr = byCategory.get(item.category) ?? [];
      arr.push(item);
      byCategory.set(item.category, arr);
    }

    const allDone =
      certainUnchecked.length === 0 && maybeItems.length === 0 && certainChecked.length > 0;

    return html`
      <h2>Boodschappen</h2>

      <div class="top-bar">
        <span class="item-count">${items.length} item${items.length !== 1 ? 's' : ''}</span>
        <div class="top-bar-actions">
          <sl-button size="small" variant="default" @click=${() => this._openManualDialog()}>
            + Handmatig
          </sl-button>
          <sl-button size="small" variant="default" @click=${() => this._regen()}>
            ↺ Vernieuwen
          </sl-button>
          <sl-button
            size="small"
            variant=${this._showCompleteConfirm ? 'warning' : 'success'}
            @click=${() => this._toggleCompleteConfirm()}
          >
            ✓ Afronden
          </sl-button>
        </div>
      </div>

      ${allDone
        ? html`<div class="all-done-banner">🎉 Alles is afgevinkt! Klaar om af te rekenen.</div>`
        : nothing}
      ${this._showCompleteConfirm
        ? html`<div class="confirm-panel">
            <p class="confirm-title">Boodschappen afronden?</p>
            <p class="confirm-body">
              Afgevinkte items worden bijgeschreven in de voorraad. Niet-afgevinkte items blijven op
              de lijst.
            </p>
            <div class="confirm-actions">
              <sl-button variant="success" @click=${() => this._completeTrip()}>
                Ja, afronden
              </sl-button>
              <sl-button variant="default" @click=${() => this._cancelComplete()}>
                Annuleren
              </sl-button>
            </div>
          </div>`
        : nothing}
      ${maybeItems.length > 0
        ? html`<div class="maybe-section">
            <div class="maybe-section-title">❓ Misschien nodig — even bevestigen</div>
            ${maybeItems.map((item) => {
              const product = productMap.get(item.productId);
              const name = product?.name ?? item.productId;
              return html`
                <div class="maybe-item">
                  <div class="item-body">
                    <span class="item-name">${name}</span>
                    <span class="item-meta">${renderMeta(item)}</span>
                  </div>
                  <div class="maybe-actions">
                    <button
                      class="maybe-btn maybe-add"
                      aria-label="Toevoegen ${name}"
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        service.resolveMaybeNeededItem(item.id, 'add');
                        this.requestUpdate();
                      }}
                    >
                      ✔ Ja
                    </button>
                    <button
                      class="maybe-btn maybe-skip"
                      aria-label="Overslaan ${name}"
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        service.resolveMaybeNeededItem(item.id, 'skip');
                        this.requestUpdate();
                      }}
                    >
                      ✖ Nee
                    </button>
                  </div>
                </div>
              `;
            })}
          </div>`
        : nothing}
      ${(Object.keys(CATEGORY_LABELS) as ProductCategory[])
        .filter((cat) => byCategory.has(cat))
        .map(
          (cat) => html`
            <div class="category-header">${CATEGORY_LABELS[cat]}</div>
            ${byCategory
              .get(cat)!
              .map((item) => this._renderCertainItem(item, productMap, recipeMap))}
          `,
        )}
      ${certainChecked.length > 0
        ? html`
            <div class="section-divider"></div>
            <div class="category-header checked-header">
              ✓ In winkelwagen (${certainChecked.length})
            </div>
            ${certainChecked.map((item) => this._renderCertainItem(item, productMap, recipeMap))}
          `
        : nothing}
      ${items.length === 0
        ? html`<div class="empty-state">
            <div class="empty-icon">✅</div>
            <p class="empty-title">Lijst is leeg</p>
            <p class="empty-sub">Voeg items toe of genereer een nieuwe lijst.</p>
          </div>`
        : nothing}
      ${this._manualItemDialog(categoryOptions, unitOptions)}
    `;
  }

  private _renderCertainItem(
    item: ShoppingListItem,
    productMap: Map<string, ReturnType<typeof service.getProducts>[number]>,
    recipeMap: Map<string, Recipe>,
  ): unknown {
    const product = productMap.get(item.productId);
    const name = product?.name ?? item.productId;
    const isChecked = item.status === 'checked';
    const unit = UNIT_LABELS[item.unit] ?? item.unit;
    const sources = [...new Set(item.sources.map((s) => sourceLabel(s, recipeMap)))].join(', ');
    const meta = `${item.quantity}\u00a0${unit}${sources ? ` · ${sources}` : ''}`;

    const toggle = (): void => {
      if (isChecked) {
        service.uncheckShoppingItem(item.id);
      } else {
        service.checkShoppingItem(item.id);
      }
      this.requestUpdate();
    };

    return html`
      <div
        class="list-item ${isChecked ? 'checked' : ''}"
        role="button"
        tabindex="0"
        aria-label="${name}, ${isChecked ? 'afgevinkt' : 'niet afgevinkt'}, klik om te wijzigen"
        @click=${toggle}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggle();
            e.preventDefault();
          }
        }}
      >
        <div class="check-circle ${isChecked ? 'is-checked' : ''}" aria-hidden="true">
          ${isChecked
            ? html`<svg
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M2 6l3 3 5-5"
                  stroke="white"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>`
            : nothing}
        </div>
        <div class="item-body">
          <span class="item-name">${name}</span>
          <span class="item-meta">${meta}</span>
        </div>
      </div>
    `;
  }

  private _manualItemDialog(categoryOptions: unknown[], unitOptions: unknown[]): unknown {
    return html`
      <sl-dialog id="manual-item-dialog" label="Handmatig toevoegen">
        <sl-input
          id="mi-qty"
          label="Hoeveelheid"
          type="number"
          min="0.1"
          step="0.1"
          value="1"
        ></sl-input>
        <br />
        <sl-select id="mi-unit" label="Eenheid" value="stuk">${unitOptions}</sl-select>
        <br />
        <sl-select id="mi-category" label="Categorie">${categoryOptions}</sl-select>
        <br />
        <sl-input id="mi-product" label="Product (naam of id)" required></sl-input>
        <sl-button slot="footer" variant="default" @click=${() => this._closeManualDialog()}>
          Annuleren
        </sl-button>
        <sl-button slot="footer" variant="primary" @click=${() => this._addManualItem()}>
          Toevoegen
        </sl-button>
      </sl-dialog>
    `;
  }

  private _generate(): void {
    service.generateShoppingListFromCurrentPlan(getCurrentWeekStart(), new Date().toISOString());
    this.requestUpdate();
  }

  private _regen(): void {
    this._showCompleteConfirm = false;
    service.generateShoppingListFromCurrentPlan(getCurrentWeekStart(), new Date().toISOString());
    this.requestUpdate();
  }

  private _toggleCompleteConfirm(): void {
    this._showCompleteConfirm = !this._showCompleteConfirm;
    this.requestUpdate();
  }

  private _completeTrip(): void {
    service.completeShoppingTrip(new Date().toISOString());
    this._showCompleteConfirm = false;
    this.requestUpdate();
  }

  private _cancelComplete(): void {
    this._showCompleteConfirm = false;
    this.requestUpdate();
  }

  private _openManualDialog(): void {
    void this.updateComplete.then(() => {
      (this.shadowRoot!.getElementById('manual-item-dialog') as SlDialog).show();
    });
  }

  private _closeManualDialog(): void {
    (this.shadowRoot!.getElementById('manual-item-dialog') as SlDialog).hide();
  }

  private _addManualItem(): void {
    const productInput = (
      this.shadowRoot!.getElementById('mi-product') as SlWithValue
    ).value.trim();
    const qty = parseFloat((this.shadowRoot!.getElementById('mi-qty') as SlWithValue).value);
    const unit = (this.shadowRoot!.getElementById('mi-unit') as SlWithValue).value as Unit;
    const category = (this.shadowRoot!.getElementById('mi-category') as SlWithValue)
      .value as ProductCategory;

    if (!productInput || !unit || !category || isNaN(qty) || qty <= 0) {
      alert('Vul product, hoeveelheid, eenheid en categorie in.');
      return;
    }

    const products = service.getProducts();
    const product = products.find(
      (p) => p.name.toLowerCase() === productInput.toLowerCase() || p.id === productInput,
    );
    const productId = product?.id ?? productInput;

    service.addManualShoppingItem({
      productId,
      quantity: qty,
      unit,
      category,
      sources: [{ type: 'manual' }],
      status: 'unchecked',
      uncertainty: 'certain',
    });

    this._closeManualDialog();
    this.requestUpdate();
  }
}

customElements.define('meal-shopping-page', ShoppingPage);
