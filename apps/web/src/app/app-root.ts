import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';

class AppRoot extends HTMLElement {
  connectedCallback(): void {
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host { display: block; max-width: 960px; margin: 0 auto; }
        sl-tab-group { --track-color: transparent; }
      </style>
      <sl-tab-group>
        <sl-tab slot="nav" panel="shopping">Boodschappen</sl-tab>
        <sl-tab slot="nav" panel="meals">Weekmenu</sl-tab>
        <sl-tab slot="nav" panel="pantry">Voorraad</sl-tab>
        <sl-tab slot="nav" panel="recipes">Recepten</sl-tab>
        <sl-tab slot="nav" panel="freezer">Vriezer</sl-tab>
        <sl-tab slot="nav" panel="products">Producten</sl-tab>

        <sl-tab-panel name="shopping"><meal-shopping-page></meal-shopping-page></sl-tab-panel>
        <sl-tab-panel name="meals"><meal-week-plan-page></meal-week-plan-page></sl-tab-panel>
        <sl-tab-panel name="pantry"><meal-pantry-page></meal-pantry-page></sl-tab-panel>
        <sl-tab-panel name="recipes"><meal-recipes-page></meal-recipes-page></sl-tab-panel>
        <sl-tab-panel name="freezer"><meal-freezer-page></meal-freezer-page></sl-tab-panel>
        <sl-tab-panel name="products"><meal-products-page></meal-products-page></sl-tab-panel>
      </sl-tab-group>
    `;
  }
}

customElements.define('meal-app-root', AppRoot);
