/**
 * Recipes page — full CRUD for recipes and their ingredients.
 * Custom element: <meal-recipes-page>
 */

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

class RecipesPage extends HTMLElement {
  private editingId: string | null = null;
  private ingredients: RecipeIngredient[] = [];

  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  private render(): void {
    const recipes = service.getRecipes();
    const shadow = this.shadowRoot!;

    shadow.innerHTML = `
      <style>
        :host { display: block; padding: 1rem; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        h2 { margin: 0; }
        .recipe-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .recipe-item { border: 1px solid #e0e0e0; border-radius: 4px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
        .recipe-name { font-weight: 500; }
        .recipe-meta { font-size: 0.85rem; color: #666; }
        .actions { display: flex; gap: 0.25rem; }
        .empty { color: #888; padding: 2rem 0; text-align: center; }
        .ingredient-row { display: flex; gap: 0.5rem; align-items: flex-end; margin-bottom: 0.5rem; flex-wrap: wrap; }
        .ingredient-row sl-input { flex: 1; min-width: 80px; }
        .ingredient-list { margin-top: 0.5rem; }
        label { font-size: 0.85rem; color: #555; display: block; margin-bottom: 0.25rem; }
      </style>
      <div class="header">
        <h2>Recepten</h2>
        <sl-button id="add-btn" variant="primary" size="small">+ Nieuw recept</sl-button>
      </div>
      ${
        recipes.length === 0
          ? '<p class="empty">Nog geen recepten. Voeg een recept toe om te beginnen.</p>'
          : `
      <div class="recipe-list">
        ${recipes
          .map(
            (r) => `
          <div class="recipe-item">
            <div>
              <div class="recipe-name">${escHtml(r.name)}</div>
              <div class="recipe-meta">${r.ingredients.length} ingrediënt${r.ingredients.length !== 1 ? 'en' : ''}</div>
            </div>
            <div class="actions">
              <sl-icon-button name="pencil" label="Bewerken" data-id="${r.id}" data-action="edit"></sl-icon-button>
              <sl-icon-button name="copy" label="Dupliceren" data-id="${r.id}" data-action="duplicate"></sl-icon-button>
              <sl-icon-button name="trash" label="Verwijderen" data-id="${r.id}" data-action="delete"></sl-icon-button>
            </div>
          </div>
        `,
          )
          .join('')}
      </div>`
      }
      <sl-dialog id="recipe-dialog" label="Recept" style="--width: 600px;">
        <sl-input id="rd-name" label="Naam" required></sl-input>
        <div class="ingredient-list">
          <br>
          <label>Ingrediënten</label>
          <div id="ingredients-container"></div>
          <sl-button id="add-ingredient-btn" size="small" variant="default">+ Ingrediënt</sl-button>
        </div>
        <sl-button slot="footer" variant="default" id="rd-cancel">Annuleren</sl-button>
        <sl-button slot="footer" variant="primary" id="rd-save">Opslaan</sl-button>
      </sl-dialog>
    `;

    this.bindEvents();
  }

  private renderIngredients(): void {
    const container = this.shadowRoot!.getElementById('ingredients-container')!;
    const products = service.getProducts();
    const productOptions = products
      .map((p) => `<option value="${p.id}">${escHtml(p.name)}</option>`)
      .join('');

    container.innerHTML = this.ingredients
      .map(
        (ing, i) => `
      <div class="ingredient-row" data-index="${i}">
        <div>
          <label>Product</label>
          <select class="ing-product" data-index="${i}" style="padding:0.4rem;border:1px solid #ccc;border-radius:4px;">
            <option value="">— kies product —</option>
            ${productOptions}
          </select>
        </div>
        <sl-input class="ing-qty" data-index="${i}" label="Hoeveelheid" type="number" min="0" value="${ing.quantity}" style="width:100px;"></sl-input>
        <div>
          <label>Eenheid</label>
          <select class="ing-unit" data-index="${i}" style="padding:0.4rem;border:1px solid #ccc;border-radius:4px;">
            ${Object.entries(UNIT_LABELS)
              .map(
                ([v, l]) =>
                  `<option value="${v}" ${ing.unit === v ? 'selected' : ''}>${l}</option>`,
              )
              .join('')}
          </select>
        </div>
        <sl-icon-button name="trash" label="Verwijderen" class="remove-ing" data-index="${i}"></sl-icon-button>
      </div>
    `,
      )
      .join('');

    // Set the product select value after rendering
    container.querySelectorAll('.ing-product').forEach((sel) => {
      const idx = parseInt((sel as HTMLElement).dataset['index'] ?? '0');
      const ing = this.ingredients[idx];
      if (ing) (sel as HTMLSelectElement).value = ing.productId;
    });

    container.querySelectorAll('.remove-ing').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt((btn as HTMLElement).dataset['index'] ?? '0');
        this.ingredients.splice(idx, 1);
        this.renderIngredients();
      });
    });
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

    shadow.querySelectorAll('[data-action="duplicate"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        service.duplicateRecipe((btn as HTMLElement).dataset['id']!);
        this.render();
      });
    });

    shadow.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (confirm('Recept verwijderen?')) {
          service.deleteRecipe((btn as HTMLElement).dataset['id']!);
          this.render();
        }
      });
    });

    shadow.getElementById('add-ingredient-btn')?.addEventListener('click', () => {
      const products = service.getProducts();
      if (products.length === 0) {
        alert('Voeg eerst producten toe voordat je ingrediënten kunt toevoegen.');
        return;
      }
      this.ingredients.push({
        productId: products[0]!.id,
        quantity: 1,
        unit: Unit.stuk,
        flags: [IngredientFlag.fresh],
      });
      this.renderIngredients();
    });

    shadow.getElementById('rd-cancel')?.addEventListener('click', () => {
      this.closeDialog();
    });

    shadow.getElementById('rd-save')?.addEventListener('click', () => {
      this.saveRecipe();
    });
  }

  private openDialog(recipeId: string | null): void {
    this.editingId = recipeId;
    const shadow = this.shadowRoot!;
    const nameEl = shadow.getElementById('rd-name') as HTMLElement & { value: string };

    if (recipeId) {
      const recipe = service.getRecipes().find((r) => r.id === recipeId);
      if (recipe) {
        nameEl.value = recipe.name;
        this.ingredients = recipe.ingredients.map((i) => ({ ...i }));
      }
    } else {
      nameEl.value = '';
      this.ingredients = [];
    }

    this.renderIngredients();
    const dialog = shadow.getElementById('recipe-dialog') as HTMLElement & { show(): void };
    dialog.show();
  }

  private closeDialog(): void {
    const dialog = this.shadowRoot!.getElementById('recipe-dialog') as HTMLElement & {
      hide(): void;
    };
    dialog.hide();
  }

  private collectIngredients(): RecipeIngredient[] {
    const container = this.shadowRoot!.getElementById('ingredients-container')!;
    const result: RecipeIngredient[] = [];
    container.querySelectorAll('.ingredient-row').forEach((row) => {
      const idx = parseInt((row as HTMLElement).dataset['index'] ?? '0');
      const productId = (row.querySelector('.ing-product') as HTMLSelectElement).value;
      const qty = parseFloat(
        (row.querySelector('.ing-qty') as HTMLElement & { value: string }).value || '0',
      );
      const unit = (row.querySelector('.ing-unit') as HTMLSelectElement).value as Unit;
      const ing = this.ingredients[idx];
      if (productId && qty > 0) {
        result.push({
          productId,
          quantity: qty,
          unit,
          flags: ing?.flags ?? [IngredientFlag.fresh],
        });
      }
    });
    return result;
  }

  private saveRecipe(): void {
    const shadow = this.shadowRoot!;
    const name = (shadow.getElementById('rd-name') as HTMLElement & { value: string }).value.trim();
    if (!name) {
      alert('Vul een naam in voor het recept.');
      return;
    }

    const ingredients = this.collectIngredients();
    const recipeData: Omit<Recipe, 'id'> = { name, ingredients };

    if (this.editingId) {
      const existing = service.getRecipes().find((r) => r.id === this.editingId);
      if (existing) {
        service.updateRecipe({ ...existing, ...recipeData });
      }
    } else {
      service.addRecipe(recipeData);
    }

    this.closeDialog();
    this.render();
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

customElements.define('meal-recipes-page', RecipesPage);
