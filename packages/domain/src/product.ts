/**
 * Product — a unique item the household tracks (e.g. "ui", "gehakt", "melk").
 */

export enum ProductCategory {
  groente_fruit = 'groente_fruit',
  vlees_vis = 'vlees_vis',
  zuivel = 'zuivel',
  houdbaar = 'houdbaar',
  diepvries = 'diepvries',
  brood = 'brood',
  drinken = 'drinken',
  huishouden = 'huishouden',
  cosmetica_deo = 'cosmetica_deo',
  overige = 'overige',
}

export enum Unit {
  gram = 'gram',
  kilogram = 'kilogram',
  milliliter = 'milliliter',
  liter = 'liter',
  stuk = 'stuk',
  zak = 'zak',
  pak = 'pak',
  blik = 'blik',
  fles = 'fles',
  pot = 'pot',
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  defaultUnit?: Unit;
  tags?: string[];
}
