/**
 * Pantry page — view and update voorraad status per product.
 * Custom element: <meal-pantry-page>
 */

import { LitElement, html, css } from 'lit';

import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/button-group/button-group.js';

import { PantryStatus } from '@pantry/domain';
import { service } from '../services.js';
import { CATEGORY_LABELS, PANTRY_STATUS_LABELS } from '../labels.js';

const STATUS_VARIANTS: Record<PantryStatus, string> = {
  [PantryStatus.in_house]: 'success',
  [PantryStatus.possibly_running_out]: 'warning',
  [PantryStatus.out]: 'danger',
};

class PantryPage extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 1rem;
    }
    h2 {
      margin: 0 0 1rem;
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
      flex-wrap: wrap;
    }
    .empty {
      color: #888;
      padding: 2rem 0;
      text-align: center;
    }
  `;

  protected override render(): unknown {
    const pantryItems = service.getPantryItems();
    const products = service.getProducts();
    const productMap = new Map(products.map((p) => [p.id, p]));

    return html`
      <h2>Voorraad</h2>
      ${pantryItems.length === 0
        ? html`<p class="empty">
            Geen voorraad-items. Voltooi een boodschappenreis om items toe te voegen.
          </p>`
        : html`<table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Categorie</th>
                <th>Status</th>
                <th>Wijzigen</th>
              </tr>
            </thead>
            <tbody>
              ${pantryItems.map((item) => {
                const product = productMap.get(item.productId);
                const name = product?.name ?? item.productId;
                const cat = product ? (CATEGORY_LABELS[product.category] ?? '') : '';
                const variant = STATUS_VARIANTS[item.status];
                const label = PANTRY_STATUS_LABELS[item.status];
                return html`
                  <tr>
                    <td>${name}</td>
                    <td>${cat}</td>
                    <td><sl-badge variant=${variant}>${label}</sl-badge></td>
                    <td class="actions">
                      ${Object.values(PantryStatus).map(
                        (s) => html`
                          <sl-button
                            size="small"
                            variant=${s === item.status ? 'primary' : 'default'}
                            @click=${() => this._setStatus(item.productId, s)}
                          >
                            ${PANTRY_STATUS_LABELS[s]}
                          </sl-button>
                        `,
                      )}
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          </table>`}
    `;
  }

  private _setStatus(productId: string, status: PantryStatus): void {
    service.setPantryStatus(productId, status, new Date().toISOString());
    this.requestUpdate();
  }
}

customElements.define('meal-pantry-page', PantryPage);
