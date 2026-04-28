/**
 * Products page — full CRUD for household products.
 * Custom element: <meal-products-page>
 */

import { LitElement, html, css } from 'lit';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import type { ProductCategory, Unit } from '@pantry/domain';
import { service } from '../services.js';
import { CATEGORY_LABELS, UNIT_LABELS } from '../labels.js';

type SlWithValue = HTMLElement & { value: string };
type SlDialog = HTMLElement & { show(): void; hide(): void };

const categoryOptions = Object.entries(CATEGORY_LABELS).map(
  ([v, l]) => html`<sl-option value=${v}>${l}</sl-option>`,
);

const unitOptions = [
  html`<sl-option value="">— geen standaard —</sl-option>`,
  ...Object.entries(UNIT_LABELS).map(([v, l]) => html`<sl-option value=${v}>${l}</sl-option>`),
];

class ProductsPage extends LitElement {
  private _editingId: string | null = null;

  static override styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    h2 {
      margin: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      text-align: left;
      padding: 0.5rem;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      font-weight: 600;
      background: #f5f5f5;
    }
    .actions {
      display: flex;
      gap: 0.25rem;
    }
    .empty {
      color: #888;
      padding: 2rem 0;
      text-align: center;
    }
  `;

  protected override render(): unknown {
    const products = service.getProducts();

    return html`
      <div class="header">
        <h2>Producten</h2>
        <sl-button variant="primary" size="small" @click=${() => this._openDialog(null)}>
          + Nieuw product
        </sl-button>
      </div>
      ${products.length === 0
        ? html`<p class="empty">Nog geen producten. Voeg een product toe om te beginnen.</p>`
        : html`<table>
            <thead>
              <tr>
                <th>Naam</th>
                <th>Categorie</th>
                <th>Eenheid</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${products.map(
                (p) => html`
                  <tr>
                    <td>${p.name}</td>
                    <td>${CATEGORY_LABELS[p.category] ?? p.category}</td>
                    <td>${p.defaultUnit ? (UNIT_LABELS[p.defaultUnit] ?? p.defaultUnit) : '—'}</td>
                    <td class="actions">
                      <sl-icon-button
                        name="pencil"
                        label="Bewerken"
                        @click=${() => this._openDialog(p.id)}
                      ></sl-icon-button>
                      <sl-icon-button
                        name="trash"
                        label="Verwijderen"
                        @click=${() => this._delete(p.id)}
                      ></sl-icon-button>
                    </td>
                  </tr>
                `,
              )}
            </tbody>
          </table>`}

      <sl-dialog id="product-dialog" label="Product">
        <sl-input id="pd-name" label="Naam" required></sl-input>
        <br />
        <sl-select id="pd-category" label="Categorie" required>${categoryOptions}</sl-select>
        <br />
        <sl-select id="pd-unit" label="Standaard eenheid">${unitOptions}</sl-select>
        <sl-button slot="footer" variant="default" @click=${() => this._closeDialog()}>
          Annuleren
        </sl-button>
        <sl-button slot="footer" variant="primary" @click=${() => this._saveProduct()}>
          Opslaan
        </sl-button>
      </sl-dialog>
    `;
  }

  private _delete(id: string): void {
    if (confirm('Product verwijderen?')) {
      service.deleteProduct(id);
      this.requestUpdate();
    }
  }

  private _openDialog(productId: string | null): void {
    this._editingId = productId;
    void this.updateComplete.then(() => {
      const nameEl = this.shadowRoot!.getElementById('pd-name') as SlWithValue;
      const catEl = this.shadowRoot!.getElementById('pd-category') as SlWithValue;
      const unitEl = this.shadowRoot!.getElementById('pd-unit') as SlWithValue;

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

      (this.shadowRoot!.getElementById('product-dialog') as SlDialog).show();
    });
  }

  private _closeDialog(): void {
    (this.shadowRoot!.getElementById('product-dialog') as SlDialog).hide();
  }

  private _saveProduct(): void {
    const name = (this.shadowRoot!.getElementById('pd-name') as SlWithValue).value.trim();
    const category = (this.shadowRoot!.getElementById('pd-category') as SlWithValue)
      .value as ProductCategory;
    const unit = (this.shadowRoot!.getElementById('pd-unit') as SlWithValue).value as Unit | '';

    if (!name || !category) {
      alert('Vul naam en categorie in.');
      return;
    }

    const input = {
      name,
      category,
      ...(unit ? { defaultUnit: unit } : {}),
    };

    if (this._editingId) {
      const existing = service.getProducts().find((p) => p.id === this._editingId);
      if (existing) {
        service.updateProduct({ ...existing, ...input });
      }
    } else {
      service.addProduct(input);
    }

    this._closeDialog();
    this.requestUpdate();
  }
}

customElements.define('meal-products-page', ProductsPage);
