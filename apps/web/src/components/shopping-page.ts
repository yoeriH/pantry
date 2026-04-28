/**
 * Shopping page — active shopping list management.
 * Custom element: <meal-shopping-page>
 */

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js';

import type { ProductCategory, Unit } from '@pantry/domain';
import { service } from '../services.js';
import { CATEGORY_LABELS, UNIT_LABELS, getCurrentWeekStart } from '../labels.js';

const categoryOptions = Object.entries(CATEGORY_LABELS)
  .map(([v, l]) => `<sl-option value="${v}">${l}</sl-option>`)
  .join('');

const unitOptions = Object.entries(UNIT_LABELS)
  .map(([v, l]) => `<sl-option value="${v}">${l}</sl-option>`)
  .join('');

class ShoppingPage extends HTMLElement {
  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  private render(): void {
    const shadow = this.shadowRoot!;
    const activeList = service.getActiveShoppingList();
    const products = service.getProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));

    let content: string;

    if (!activeList) {
      content = `
        <div class="empty">
          <p>Geen actieve boodschappenlijst.</p>
          <sl-button id="gen-btn" variant="primary">Genereer boodschappenlijst</sl-button>
        </div>
      `;
    } else {
      const items = activeList.items;
      const maybeItems = items.filter((i) => i.uncertainty === 'maybe_needed');
      const certainItems = items.filter((i) => i.uncertainty === 'certain');

      const renderItem = (item: (typeof items)[number]) => {
        const product = productMap.get(item.productId);
        const name = product?.name ?? item.productId;
        const unit = UNIT_LABELS[item.unit] ?? item.unit;
        const isMaybe = item.uncertainty === 'maybe_needed';
        const isChecked = item.status === 'checked';

        if (isMaybe) {
          return `
            <div class="list-item maybe" data-id="${item.id}">
              <div class="item-info">
                <sl-badge variant="warning">Misschien nodig</sl-badge>
                <span class="item-name">${escHtml(name)}</span>
                <span class="item-qty">${item.quantity} ${escHtml(unit)}</span>
              </div>
              <div class="item-actions">
                <sl-button size="small" variant="success" data-action="resolve-add" data-id="${item.id}">Toevoegen</sl-button>
                <sl-button size="small" variant="default" data-action="resolve-skip" data-id="${item.id}">Overslaan</sl-button>
              </div>
            </div>
          `;
        }

        return `
          <div class="list-item ${isChecked ? 'checked' : ''}" data-id="${item.id}">
            <div class="item-info">
              <input type="checkbox" class="item-check" data-id="${item.id}" ${isChecked ? 'checked' : ''}>
              <span class="item-name ${isChecked ? 'strikethrough' : ''}">${escHtml(name)}</span>
              <span class="item-qty">${item.quantity} ${escHtml(unit)}</span>
            </div>
            <sl-icon-button name="trash" label="Verwijderen" size="small" data-action="remove-item" data-id="${item.id}"></sl-icon-button>
          </div>
        `;
      };

      content = `
        <div class="list-header">
          <span>${items.length} item${items.length !== 1 ? 's' : ''}</span>
          <div class="list-header-actions">
            <sl-button id="add-manual-btn" size="small">+ Handmatig toevoegen</sl-button>
            <sl-button id="complete-btn" size="small" variant="success">✓ Boodschappen gedaan</sl-button>
            <sl-button id="regen-btn" size="small" variant="default">Hergen. lijst</sl-button>
          </div>
        </div>
        ${maybeItems.length > 0 ? `<div class="section-title">Misschien nodig</div>${maybeItems.map(renderItem).join('')}` : ''}
        ${certainItems.length > 0 ? `<div class="section-title">Boodschappen</div>${certainItems.map(renderItem).join('')}` : ''}
        ${items.length === 0 ? '<p class="empty-list">Lijst is leeg.</p>' : ''}
      `;
    }

    shadow.innerHTML = `
      <style>
        :host { display: block; padding: 1rem; }
        h2 { margin: 0 0 1rem; }
        .empty { text-align: center; padding: 2rem 0; }
        .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem; }
        .list-header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .section-title { font-weight: 600; color: #555; font-size: 0.85rem; text-transform: uppercase; margin: 1rem 0 0.5rem; letter-spacing: 0.05em; }
        .list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.75rem; border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 0.35rem; }
        .list-item.checked { background: #f9f9f9; opacity: 0.7; }
        .list-item.maybe { background: #fffbea; }
        .item-info { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
        .item-name { font-weight: 500; }
        .item-name.strikethrough { text-decoration: line-through; color: #888; }
        .item-qty { font-size: 0.85rem; color: #666; }
        .item-check { width: 18px; height: 18px; cursor: pointer; }
        .item-actions { display: flex; gap: 0.25rem; }
        .empty-list { color: #888; text-align: center; padding: 1rem 0; }
      </style>
      <h2>Boodschappen</h2>
      ${content}
      <sl-dialog id="manual-item-dialog" label="Handmatig toevoegen">
        <sl-input id="mi-qty" label="Hoeveelheid" type="number" min="0.1" step="0.1" value="1"></sl-input>
        <br>
        <sl-select id="mi-unit" label="Eenheid" value="stuk">
          ${unitOptions}
        </sl-select>
        <br>
        <sl-select id="mi-category" label="Categorie">
          ${categoryOptions}
        </sl-select>
        <br>
        <sl-input id="mi-product" label="Product (naam of id)" required></sl-input>
        <sl-button slot="footer" variant="default" id="mi-cancel">Annuleren</sl-button>
        <sl-button slot="footer" variant="primary" id="mi-save">Toevoegen</sl-button>
      </sl-dialog>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const shadow = this.shadowRoot!;

    shadow.getElementById('gen-btn')?.addEventListener('click', () => {
      service.generateShoppingListFromCurrentPlan(getCurrentWeekStart(), new Date().toISOString());
      this.render();
    });

    shadow.getElementById('regen-btn')?.addEventListener('click', () => {
      service.generateShoppingListFromCurrentPlan(getCurrentWeekStart(), new Date().toISOString());
      this.render();
    });

    shadow.getElementById('complete-btn')?.addEventListener('click', () => {
      if (confirm('Boodschappen afronden? Dit werkt de voorraad bij.')) {
        service.completeShoppingTrip(new Date().toISOString());
        this.render();
      }
    });

    shadow.querySelectorAll('[data-action="resolve-add"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        service.resolveMaybeNeededItem((btn as HTMLElement).dataset['id']!, 'add');
        this.render();
      });
    });

    shadow.querySelectorAll('[data-action="resolve-skip"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        service.resolveMaybeNeededItem((btn as HTMLElement).dataset['id']!, 'skip');
        this.render();
      });
    });

    shadow.querySelectorAll('.item-check').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const el = checkbox as HTMLInputElement;
        const id = el.dataset['id']!;
        if (el.checked) {
          service.checkShoppingItem(id);
        } else {
          service.uncheckShoppingItem(id);
        }
        this.render();
      });
    });

    shadow.getElementById('add-manual-btn')?.addEventListener('click', () => {
      const dialog = shadow.getElementById('manual-item-dialog') as HTMLElement & {
        show(): void;
      };
      dialog.show();
    });

    shadow.getElementById('mi-cancel')?.addEventListener('click', () => {
      this.closeManualDialog();
    });

    shadow.getElementById('mi-save')?.addEventListener('click', () => {
      this.addManualItem();
    });
  }

  private closeManualDialog(): void {
    const dialog = this.shadowRoot!.getElementById('manual-item-dialog') as HTMLElement & {
      hide(): void;
    };
    dialog.hide();
  }

  private addManualItem(): void {
    const shadow = this.shadowRoot!;
    const productInput = (
      shadow.getElementById('mi-product') as HTMLElement & { value: string }
    ).value.trim();
    const qty = parseFloat(
      (shadow.getElementById('mi-qty') as HTMLElement & { value: string }).value,
    );
    const unit = (shadow.getElementById('mi-unit') as HTMLElement & { value: string })
      .value as Unit;
    const category = (shadow.getElementById('mi-category') as HTMLElement & { value: string })
      .value as ProductCategory;

    if (!productInput || !unit || !category || isNaN(qty) || qty <= 0) return;

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

    this.closeManualDialog();
    this.render();
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

customElements.define('meal-shopping-page', ShoppingPage);
