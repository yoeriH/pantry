/**
 * Pantry page — view and update voorraad status per product.
 * Custom element: <meal-pantry-page>
 */

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

class PantryPage extends HTMLElement {
  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  private render(): void {
    const shadow = this.shadowRoot!;
    const pantryItems = service.getPantryItems();
    const products = service.getProducts();

    const productMap = new Map(products.map((p) => [p.id, p]));

    const rows = pantryItems
      .map((item) => {
        const product = productMap.get(item.productId);
        const name = product ? escHtml(product.name) : escHtml(item.productId);
        const cat = product ? escHtml(CATEGORY_LABELS[product.category] ?? '') : '';
        const variant = STATUS_VARIANTS[item.status];
        const label = PANTRY_STATUS_LABELS[item.status];
        return `
          <tr>
            <td>${name}</td>
            <td>${cat}</td>
            <td><sl-badge variant="${variant}">${label}</sl-badge></td>
            <td class="actions">
              ${Object.values(PantryStatus)
                .map(
                  (s) => `
                <sl-button size="small" variant="${s === item.status ? 'primary' : 'default'}"
                  data-product-id="${item.productId}" data-status="${s}">
                  ${escHtml(PANTRY_STATUS_LABELS[s])}
                </sl-button>
              `,
                )
                .join('')}
            </td>
          </tr>
        `;
      })
      .join('');

    shadow.innerHTML = `
      <style>
        :host { display: block; padding: 1rem; }
        h2 { margin: 0 0 1rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #e0e0e0; }
        th { font-weight: 600; background: #f5f5f5; }
        .actions { display: flex; gap: 0.25rem; flex-wrap: wrap; }
        .empty { color: #888; padding: 2rem 0; text-align: center; }
      </style>
      <h2>Voorraad</h2>
      ${
        pantryItems.length === 0
          ? '<p class="empty">Geen voorraad-items. Voltooi een boodschappenreis om items toe te voegen.</p>'
          : `<table>
            <thead><tr><th>Product</th><th>Categorie</th><th>Status</th><th>Wijzigen</th></tr></thead>
            <tbody>${rows}</tbody>
           </table>`
      }
    `;

    shadow.querySelectorAll('[data-status]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const el = btn as HTMLElement;
        const productId = el.dataset['productId']!;
        const status = el.dataset['status'] as PantryStatus;
        service.setPantryStatus(productId, status, new Date().toISOString());
        this.render();
      });
    });
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

customElements.define('meal-pantry-page', PantryPage);
