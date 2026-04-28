/**
 * Freezer page — full CRUD for freezer items, with portion consumption.
 * Custom element: <meal-freezer-page>
 */

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';

import type { FreezerItem } from '@pantry/domain';
import { service } from '../services.js';

class FreezerPage extends HTMLElement {
  private editingId: string | null = null;

  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  private render(): void {
    const items = service.getFreezerItems();
    const shadow = this.shadowRoot!;

    shadow.innerHTML = `
      <style>
        :host { display: block; padding: 1rem; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        h2 { margin: 0; }
        .item-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .item-row { border: 1px solid #e0e0e0; border-radius: 4px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
        .item-name { font-weight: 500; }
        .item-meta { font-size: 0.85rem; color: #666; margin-top: 0.2rem; }
        .actions { display: flex; gap: 0.25rem; align-items: center; }
        .empty { color: #888; padding: 2rem 0; text-align: center; }
      </style>
      <div class="header">
        <h2>Vriezer</h2>
        <sl-button id="add-btn" variant="primary" size="small">+ Nieuw item</sl-button>
      </div>
      ${
        items.length === 0
          ? '<p class="empty">De vriezer is leeg.</p>'
          : `
      <div class="item-list">
        ${items
          .map((item) => {
            const name = item.name ?? item.productId ?? '—';
            return `
          <div class="item-row">
            <div>
              <div class="item-name">${escHtml(name)}</div>
              <div class="item-meta">
                <sl-badge variant="${item.portions > 2 ? 'success' : item.portions > 0 ? 'warning' : 'danger'}">${item.portions} portie${item.portions !== 1 ? 's' : ''}</sl-badge>
              </div>
            </div>
            <div class="actions">
              <sl-button size="small" variant="default" data-action="consume" data-id="${item.id}" title="Gebruik 1 portie">−1</sl-button>
              <sl-icon-button name="pencil" label="Bewerken" data-id="${item.id}" data-action="edit"></sl-icon-button>
              <sl-icon-button name="trash" label="Verwijderen" data-id="${item.id}" data-action="delete"></sl-icon-button>
            </div>
          </div>`;
          })
          .join('')}
      </div>`
      }
      <sl-dialog id="freezer-dialog" label="Vriezeritem">
        <sl-input id="fd-name" label="Naam" required></sl-input>
        <br>
        <sl-input id="fd-portions" label="Aantal porties" type="number" min="1" value="1"></sl-input>
        <sl-button slot="footer" variant="default" id="fd-cancel">Annuleren</sl-button>
        <sl-button slot="footer" variant="primary" id="fd-save">Opslaan</sl-button>
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
        this.openDialog((btn as HTMLElement).dataset['id']!);
      });
    });

    shadow.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('Vriezeritem verwijderen?')) {
          service.deleteFreezerItem((btn as HTMLElement).dataset['id']!);
          this.render();
        }
      });
    });

    shadow.querySelectorAll('[data-action="consume"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        service.consumeFreezerItem((btn as HTMLElement).dataset['id']!, 1);
        this.render();
      });
    });

    shadow.getElementById('fd-cancel')?.addEventListener('click', () => {
      this.closeDialog();
    });

    shadow.getElementById('fd-save')?.addEventListener('click', () => {
      this.saveItem();
    });
  }

  private openDialog(itemId: string | null): void {
    this.editingId = itemId;
    const shadow = this.shadowRoot!;
    const nameEl = shadow.getElementById('fd-name') as HTMLElement & { value: string };
    const portionsEl = shadow.getElementById('fd-portions') as HTMLElement & { value: string };

    if (itemId) {
      const item = service.getFreezerItems().find((f) => f.id === itemId);
      if (item) {
        nameEl.value = item.name ?? item.productId ?? '';
        portionsEl.value = String(item.portions);
      }
    } else {
      nameEl.value = '';
      portionsEl.value = '1';
    }

    const dialog = shadow.getElementById('freezer-dialog') as HTMLElement & { show(): void };
    dialog.show();
  }

  private closeDialog(): void {
    const dialog = this.shadowRoot!.getElementById('freezer-dialog') as HTMLElement & {
      hide(): void;
    };
    dialog.hide();
  }

  private saveItem(): void {
    const shadow = this.shadowRoot!;
    const name = (shadow.getElementById('fd-name') as HTMLElement & { value: string }).value.trim();
    const portions = parseInt(
      (shadow.getElementById('fd-portions') as HTMLElement & { value: string }).value,
      10,
    );

    if (!name || portions < 1) {
      alert('Vul een naam in en geef minimaal 1 portie op.');
      return;
    }

    const now = new Date().toISOString();

    if (this.editingId) {
      const existing = service.getFreezerItems().find((f) => f.id === this.editingId);
      if (existing) {
        const updated: FreezerItem = { ...existing, name, portions };
        service.updateFreezerItem(updated);
      }
    } else {
      service.addFreezerItem({ name, portions, createdAt: now });
    }

    this.closeDialog();
    this.render();
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

customElements.define('meal-freezer-page', FreezerPage);
