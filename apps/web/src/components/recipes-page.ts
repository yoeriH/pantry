/**
 * Recipes page — full CRUD for recipes and their ingredients.
 * Custom element: <meal-recipes-page>
 */

import { LitElement, html, css } from 'lit';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import type { Recipe, RecipeIngredient } from '@pantry/domain';
import { Unit, IngredientFlag } from '@pantry/domain';
import { service } from '../services.js';
import { UNIT_LABELS } from '../labels.js';

type SlWithValue = HTMLElement & { value: string };
type SlDialog = HTMLElement & { show(): void; hide(): void };

class RecipesPage extends LitElement {
  private _editingId: string | null = null;
  private _ingredients: RecipeIngredient[] = [];

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
    .recipe-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .recipe-item {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .recipe-name {
      font-weight: 500;
    }
    .recipe-meta {
      font-size: 0.85rem;
      color: #666;
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
    .ingredient-row {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .ingredient-row sl-input {
      flex: 1;
      min-width: 80px;
    }
    .ingredient-list {
      margin-top: 0.5rem;
    }
    label {
      font-size: 0.85rem;
      color: #555;
      display: block;
      margin-bottom: 0.25rem;
    }
    select {
      padding: 0.4rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
  `;

  protected override render(): unknown {
    const recipes = service.getRecipes();
    const products = service.getProducts();

    return html`
      <div class="header">
        <h2>Recepten</h2>
        <sl-button variant="primary" size="small" @click=${() => this._openDialog(null)}>
          + Nieuw recept
        </sl-button>
      </div>
      ${recipes.length === 0
        ? html`<p class="empty">Nog geen recepten. Voeg een recept toe om te beginnen.</p>`
        : html`<div class="recipe-list">
            ${recipes.map(
              (r) => html`
                <div class="recipe-item">
                  <div>
                    <div class="recipe-name">${r.name}</div>
                    <div class="recipe-meta">
                      ${r.ingredients.length} ingrediënt${r.ingredients.length !== 1 ? 'en' : ''}
                    </div>
                  </div>
                  <div class="actions">
                    <sl-icon-button
                      name="pencil"
                      label="Bewerken"
                      @click=${() => this._openDialog(r.id)}
                    ></sl-icon-button>
                    <sl-icon-button
                      name="copy"
                      label="Dupliceren"
                      @click=${() => this._duplicate(r.id)}
                    ></sl-icon-button>
                    <sl-icon-button
                      name="trash"
                      label="Verwijderen"
                      @click=${() => this._delete(r.id)}
                    ></sl-icon-button>
                  </div>
                </div>
              `,
            )}
          </div>`}

      <sl-dialog id="recipe-dialog" label="Recept" style="--width: 600px;">
        <sl-input id="rd-name" label="Naam" required></sl-input>
        <div class="ingredient-list">
          <br />
          <label>Ingrediënten</label>
          ${this._ingredients.map(
            (ing, i) => html`
              <div class="ingredient-row">
                <div>
                  <label>Product</label>
                  <select
                    .value=${ing.productId}
                    @change=${(e: Event) =>
                      this._updateIngredient(i, 'productId', (e.target as HTMLSelectElement).value)}
                  >
                    <option value="">— kies product —</option>
                    ${products.map((p) => html`<option value=${p.id}>${p.name}</option>`)}
                  </select>
                </div>
                <sl-input
                  label="Hoeveelheid"
                  type="number"
                  min="0"
                  .value=${String(ing.quantity)}
                  style="width:100px;"
                  @sl-input=${(e: Event) =>
                    this._updateIngredient(
                      i,
                      'quantity',
                      parseFloat((e.target as SlWithValue).value),
                    )}
                ></sl-input>
                <div>
                  <label>Eenheid</label>
                  <select
                    .value=${ing.unit}
                    @change=${(e: Event) =>
                      this._updateIngredient(
                        i,
                        'unit',
                        (e.target as HTMLSelectElement).value as Unit,
                      )}
                  >
                    ${Object.entries(UNIT_LABELS).map(
                      ([v, l]) => html`<option value=${v}>${l}</option>`,
                    )}
                  </select>
                </div>
                <sl-icon-button
                  name="trash"
                  label="Verwijderen"
                  @click=${() => this._removeIngredient(i)}
                ></sl-icon-button>
              </div>
            `,
          )}
          <sl-button size="small" variant="default" @click=${() => this._addIngredient()}>
            + Ingrediënt
          </sl-button>
        </div>
        <sl-button slot="footer" variant="default" @click=${() => this._closeDialog()}>
          Annuleren
        </sl-button>
        <sl-button slot="footer" variant="primary" @click=${() => this._saveRecipe()}>
          Opslaan
        </sl-button>
      </sl-dialog>
    `;
  }

  private _duplicate(id: string): void {
    service.duplicateRecipe(id);
    this.requestUpdate();
  }

  private _delete(id: string): void {
    if (confirm('Recept verwijderen?')) {
      service.deleteRecipe(id);
      this.requestUpdate();
    }
  }

  private _addIngredient(): void {
    const products = service.getProducts();
    if (products.length === 0) {
      alert('Voeg eerst producten toe voordat je ingrediënten kunt toevoegen.');
      return;
    }
    this._ingredients = [
      ...this._ingredients,
      {
        productId: products[0]!.id,
        quantity: 1,
        unit: Unit.stuk,
        flags: [IngredientFlag.fresh],
      },
    ];
    this.requestUpdate();
  }

  private _removeIngredient(index: number): void {
    this._ingredients = this._ingredients.filter((_, i) => i !== index);
    this.requestUpdate();
  }

  private _updateIngredient(
    index: number,
    field: 'productId' | 'quantity' | 'unit',
    value: string | number | Unit,
  ): void {
    this._ingredients = this._ingredients.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing,
    );
    // Intentionally no requestUpdate() here: the user's input/select already
    // reflects the value visually, and calling requestUpdate() would re-set the
    // .value property on each keystroke which can reset the cursor position in
    // number inputs. The updated _ingredients array is read on the next render
    // triggered by _addIngredient(), _removeIngredient(), or _saveRecipe().
  }

  private _openDialog(recipeId: string | null): void {
    this._editingId = recipeId;
    if (recipeId) {
      const recipe = service.getRecipes().find((r) => r.id === recipeId);
      this._ingredients = recipe ? recipe.ingredients.map((i) => ({ ...i })) : [];
    } else {
      this._ingredients = [];
    }
    this.requestUpdate();
    void this.updateComplete.then(() => {
      const nameEl = this.shadowRoot!.getElementById('rd-name') as SlWithValue;
      if (recipeId) {
        const recipe = service.getRecipes().find((r) => r.id === recipeId);
        nameEl.value = recipe?.name ?? '';
      } else {
        nameEl.value = '';
      }
      (this.shadowRoot!.getElementById('recipe-dialog') as SlDialog).show();
    });
  }

  private _closeDialog(): void {
    (this.shadowRoot!.getElementById('recipe-dialog') as SlDialog).hide();
  }

  private _saveRecipe(): void {
    const name = (this.shadowRoot!.getElementById('rd-name') as SlWithValue).value.trim();
    if (!name) {
      alert('Vul een naam in voor het recept.');
      return;
    }

    const ingredients = this._ingredients.filter((ing) => ing.productId && ing.quantity > 0);
    const recipeData: Omit<Recipe, 'id'> = { name, ingredients };

    if (this._editingId) {
      const existing = service.getRecipes().find((r) => r.id === this._editingId);
      if (existing) {
        service.updateRecipe({ ...existing, ...recipeData });
      }
    } else {
      service.addRecipe(recipeData);
    }

    this._closeDialog();
    this._ingredients = [];
    this.requestUpdate();
  }
}

customElements.define('meal-recipes-page', RecipesPage);
