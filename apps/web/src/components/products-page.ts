/**
 * Products page — full CRUD for household products.
 * Custom element: <meal-products-page>
 */

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import type { ProductCategory, Unit } from '@pantry/domain';
import { service } from '../services.js';
import { CATEGORY_LABELS, UNIT_LABELS } from '../labels.js';

const categoryOptions = Object.entries(CATEGORY_LABELS)
  .map(([v, l]) => `<sl-option value="${v}">${l}</sl-option>`)
  .join('');

const unitOptions =
  `<sl-option value="">— geen standaard —</sl-option>` +
  Object.entries(UNIT_LABELS)
    .map(([v, l]) => `<sl-option value="${v}">${l}</sl-option>`)
    .join('');

class ProductsPage extends HTMLElement {
  private editingId: string | null = null;

  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  private render(): void {
    const products = service.getProducts();
    const shadow = this.shadowRoot!;
    shadow.innerHTML = `
      <style>
        :host { display: block; padding: 1rem; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        h2 { margin: 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e0e0e0; }
        th { font-weight: 600; background: #f5f5f5; }
        .actions { display: flex; gap: 0.25rem; }
        .empty { color: #888; padding: 2rem 0; text-align: center; }
      </style>
      <div class="header">
        <h2>Producten</h2>
        <sl-button id="add-btn" variant="primary" size="small">+ Nieuw product</sl-button>
      </div>
      ${
        products.length === 0
          ? '<p class="empty">Nog geen producten. Voeg een product toe om te beginnen.</p>'
          : `
      <table>
        <thead><tr><th>Naam</th><th>Categorie</th><th>Eenheid</th><th></th></tr></thead>
        <tbody>
          ${products
            .map(
              (p) => `
            <tr>
              <td>${escHtml(p.name)}</td>
              <td>${escHtml(CATEGORY_LABELS[p.category] ?? p.category)}</td>
              <td>${p.defaultUnit ? escHtml(UNIT_LABELS[p.defaultUnit] ?? p.defaultUnit) : '—'}</td>
              <td class="actions">
                <sl-icon-button name="pencil" label="Bewerken" data-id="${p.id}" data-action="edit"></sl-icon-button>
                <sl-icon-button name="trash" label="Verwijderen" data-id="${p.id}" data-action="delete"></sl-icon-button>
              </td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>`
      }
      <sl-dialog id="product-dialog" label="Product">
        <sl-input id="pd-name" label="Naam" required></sl-input>
        <br>
        <sl-select id="pd-category" label="Categorie" required>
          ${categoryOptions}
        </sl-select>
        <br>
        <sl-select id="pd-unit" label="Standaard eenheid">
          ${unitOptions}
        </sl-select>
        <sl-button slot="footer" variant="default" id="pd-cancel">Annuleren</sl-button>
        <sl-button slot="footer" variant="primary" id="pd-save">Opslaan</sl-button>
      </sl-dialog>
    `;
    this.bindEvents();
  }

  private bindEvents(): void {
    const shadow = this.shadowRoot!;

    shadow.getElementById('add-btn')?.addEventListener('click', () => {
      this.openDialog(null);
    });

    shadow.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset['id']!;
        this.openDialog(id);
      });
    });

    shadow.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).dataset['id']!;
        if (confirm('Product verwijderen?')) {
          service.deleteProduct(id);
          this.render();
        }
      });
    });

    shadow.getElementById('pd-cancel')?.addEventListener('click', () => {
      this.closeDialog();
    });

    shadow.getElementById('pd-save')?.addEventListener('click', () => {
      this.saveProduct();
    });
  }

  private openDialog(productId: string | null): void {
    this.editingId = productId;
    const shadow = this.shadowRoot!;
    const nameEl = shadow.getElementById('pd-name') as HTMLInputElement & { value: string };
    const catEl = shadow.getElementById('pd-category') as HTMLElement & { value: string };
    const unitEl = shadow.getElementById('pd-unit') as HTMLElement & { value: string };

    if (productId) {
      const product = service.getProducts().find((p) => p.id === productId);
      if (product) {
        nameEl.value = product.name;
        catEl.value = product.category;
        unitEl.value = product.defaultUnit ?? '';
      }
    } else {
      nameEl.value = '';
      catEl.value = '';
      unitEl.value = '';
    }

    const dialog = shadow.getElementById('product-dialog') as HTMLElement & { show(): void };
    dialog.show();
  }

  private closeDialog(): void {
    const dialog = this.shadowRoot!.getElementById('product-dialog') as HTMLElement & {
      hide(): void;
    };
    dialog.hide();
  }

  private saveProduct(): void {
    const shadow = this.shadowRoot!;
    const name = (
      shadow.getElementById('pd-name') as HTMLInputElement & { value: string }
    ).value.trim();
    const category = (shadow.getElementById('pd-category') as HTMLElement & { value: string })
      .value as ProductCategory;
    const unit = (shadow.getElementById('pd-unit') as HTMLElement & { value: string }).value as
      | Unit
      | '';

    if (!name || !category) {
      alert('Vul naam en categorie in.');
      return;
    }

    const input = {
      name,
      category,
      ...(unit ? { defaultUnit: unit } : {}),
    };

    if (this.editingId) {
      const existing = service.getProducts().find((p) => p.id === this.editingId);
      if (existing) {
        service.updateProduct({ ...existing, ...input });
      }
    } else {
      service.addProduct(input);
    }

    this.closeDialog();
    this.render();
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

customElements.define('meal-products-page', ProductsPage);
