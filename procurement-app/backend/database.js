// backend/database.js

const products = [
  {
    id: 1,
    code: "P001",
    name: "Shampoo 250ml",
    }
];

const ingredients = [
  {
    id: 1,
    code: "S001",
    name: "Fragrance Oil",
    unit: "ml"
  }
];

const bom = [
  {
    productId: 1,
    ingredientId: 1,
    quantity: 5
  }
];

const forecast = [
  {
    productId: 1,
    month: "2026-06",
    quantity: 1200
  }
];

module.exports = {
  products,
  ingredients,
  bom,
  forecast
};