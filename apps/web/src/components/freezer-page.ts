/**
 * Freezer page — full CRUD for freezer items, with portion consumption.
 * Custom element: <meal-freezer-page>
 */

import { LitElement, html, css } from 'lit';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';

import type { FreezerItem } from '@pantry/domain';
import { service } from '../services.js';

/** Helper: get a Shoelace element from the shadow root by id. */
type SlWithValue = HTMLElement & { value: string };
type SlDialog = HTMLElement & { show(): void; hide(): void };

class FreezerPage extends LitElement {
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
    .item-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .item-row {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .item-name {
      font-weight: 500;
    }
    .item-meta {
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.2rem;
    }
    .actions {
      display: flex;
      gap: 0.25rem;
      align-items: center;
    }
    .empty {
      color: #888;
      padding: 2rem 0;
      text-align: center;
    }
  `;

  protected override render(): unknown {
    const items = service.getFreezerItems();

    return html`
      <div class="header">
        <h2>Vriezer</h2>
        <sl-button variant="primary" size="small" @click=${() => this._openDialog(null)}>
          + Nieuw item
        </sl-button>
      </div>
      ${items.length === 0
        ? html`<p class="empty">De vriezer is leeg.</p>`
        : html`<div class="item-list">
            ${items.map((item) => {
              const name = item.name ?? item.productId ?? '—';
              const badgeVariant =
                item.portions > 2 ? 'success' : item.portions > 0 ? 'warning' : 'danger';
              return html`
                <div class="item-row">
                  <div>
                    <div class="item-name">${name}</div>
                    <div class="item-meta">
                      <sl-badge variant=${badgeVariant}>
                        ${item.portions} portie${item.portions !== 1 ? 's' : ''}
                      </sl-badge>
                    </div>
                  </div>
                  <div class="actions">
                    <sl-button
                      size="small"
                      variant="default"
                      title="Gebruik 1 portie"
                      @click=${() => this._consume(item.id)}
                    >
                      −1
                    </sl-button>
                    <sl-icon-button
                      name="pencil"
                      label="Bewerken"
                      @click=${() => this._openDialog(item.id)}
                    ></sl-icon-button>
                    <sl-icon-button
                      name="trash"
                      label="Verwijderen"
                      @click=${() => this._delete(item.id)}
                    ></sl-icon-button>
                  </div>
                </div>
              `;
            })}
          </div>`}

      <sl-dialog id="freezer-dialog" label="Vriezeritem">
        <sl-input id="fd-name" label="Naam" required></sl-input>
        <br />
        <sl-input
          id="fd-portions"
          label="Aantal porties"
          type="number"
          min="1"
          value="1"
        ></sl-input>
        <sl-button slot="footer" variant="default" @click=${() => this._closeDialog()}>
          Annuleren
        </sl-button>
        <sl-button slot="footer" variant="primary" @click=${() => this._saveItem()}>
          Opslaan
        </sl-button>
      </sl-dialog>
    `;
  }

  private _consume(id: string): void {
    service.consumeFreezerItem(id, 1);
    this.requestUpdate();
  }

  private _delete(id: string): void {
    if (confirm('Vriezeritem verwijderen?')) {
      service.deleteFreezerItem(id);
      this.requestUpdate();
    }
  }

  private _openDialog(id: string | null): void {
    this._editingId = id;
    void this.updateComplete.then(() => {
      const nameEl = this.shadowRoot!.getElementById('fd-name') as SlWithValue;
      const portionsEl = this.shadowRoot!.getElementById('fd-portions') as SlWithValue;
      if (id) {
        const item = service.getFreezerItems().find((f) => f.id === id);
        if (item) {
          nameEl.value = item.name ?? item.productId ?? '';
          portionsEl.value = String(item.portions);
        }
      } else {
        nameEl.value = '';
        portionsEl.value = '1';
      }
      (this.shadowRoot!.getElementById('freezer-dialog') as SlDialog).show();
    });
  }

  private _closeDialog(): void {
    (this.shadowRoot!.getElementById('freezer-dialog') as SlDialog).hide();
  }

  private _saveItem(): void {
    const name = (this.shadowRoot!.getElementById('fd-name') as SlWithValue).value.trim();
    const portions = parseInt(
      (this.shadowRoot!.getElementById('fd-portions') as SlWithValue).value,
      10,
    );

    if (!name || portions < 1) {
      alert('Vul een naam in en geef minimaal 1 portie op.');
      return;
    }

    const now = new Date().toISOString();

    if (this._editingId) {
      const existing = service.getFreezerItems().find((f) => f.id === this._editingId);
      if (existing) {
        const updated: FreezerItem = { ...existing, name, portions };
        service.updateFreezerItem(updated);
      }
    } else {
      service.addFreezerItem({ name, portions, createdAt: now });
    }

    this._closeDialog();
    this.requestUpdate();
  }
}

customElements.define('meal-freezer-page', FreezerPage);
