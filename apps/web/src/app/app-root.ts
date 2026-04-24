class AppRoot extends HTMLElement {
  connectedCallback(): void {
    this.attachShadow({ mode: 'open' });
  }
}

customElements.define('meal-app-root', AppRoot);
