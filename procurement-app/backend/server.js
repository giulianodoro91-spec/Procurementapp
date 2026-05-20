const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Procurement App Backend Running');
});

const db = require('./database');

const multer = require('multer');
const xlsx = require('xlsx');
const upload = multer();

// Simple read endpoints
app.get('/api/products', (req, res) => {
  res.json(db.products);
});

app.get('/api/ingredients', (req, res) => {
  res.json(db.ingredients);
});

app.get('/api/bom', (req, res) => {
  const bomWithNames = db.bom.map(row => {
    const product = db.products.find(p => p.id === row.productId)
    const ingredient = db.ingredients.find(i => i.id === row.ingredientId)
    const { unit, ...bomRow } = row
    return {
      ...bomRow,
      productName: product?.name || 'Unknown',
      ingredientName: ingredient?.name || 'Unknown',
      ingredientUnit: ingredient?.unit || 'unit'
    }
  })
  res.json(bomWithNames);
});

// Clear BOM rows or clear all data when ?full=true
app.post('/api/bom/clear', (req, res) => {
  const full = req.query.full === 'true'
  db.bom.length = 0
  if (full) {
    db.products.length = 0
    db.ingredients.length = 0
    db.forecast.length = 0
  }
  res.json({ ok: true, cleared: { bom: true, products: full, ingredients: full, forecast: full } })
})

app.get('/api/forecast', (req, res) => {
  res.json(db.forecast);
});

// Add or replace forecast entries (array)
app.post('/api/forecast', (req, res) => {
  const entries = req.body;
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'Array expected' });
  // naive replace for simplicity
  db.forecast.length = 0;
  entries.forEach(e => db.forecast.push(e));
  res.json({ ok: true, forecast: db.forecast });
});

// Import BOM rows (array of {productId, ingredientId, quantity})
app.post('/api/bom/import', (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Array expected' });
  // append rows
  rows.forEach(r => db.bom.push(r));
  res.json({ ok: true, bom: db.bom });
});

const normalize = (value) => typeof value === 'string' ? value.trim() : value

const getField = (row, ...fieldNames) => {
  for (const field of fieldNames) {
    if (field in row && row[field] != null) return row[field]
  }
  return undefined
}

const normalizeKey = (key) => String(key).trim()

const getExtraFields = (row) => {
  const known = new Set([
    'productId', 'product_id', 'ProductId', 'product id', 'Product ID',
    'productName', 'ProductName', 'product', 'Product', 'Product Name', 'product name',
    'ingredientId', 'ingredient_id', 'IngredientId', 'ingredient id', 'Ingredient ID',
    'ingredientName', 'IngredientName', 'ingredient', 'Ingredient', 'Ingredient Name', 'ingredient name',
    'quantity', 'Quantity', 'qty', 'Qty', 'amount', 'Amount',
    'unit', 'Unit', 'UoM', 'uom', 'UOM',
    'category', 'Category', 'notes', 'Notes'
  ])
  return Object.entries(row).reduce((extra, [key, value]) => {
    if (!known.has(key)) {
      extra[normalizeKey(key)] = value
    }
    return extra
  }, {})
}

const findOrCreateProduct = (name) => {
  if (!name) return null
  const normalized = String(name).trim()
  let product = db.products.find(p => p.name.toLowerCase() === normalized.toLowerCase())
  if (!product) {
    product = { id: db.products.length + 1, name: normalized }
    db.products.push(product)
  }
  return product
}

const findOrCreateIngredient = (name, unit) => {
  if (!name) return null
  const normalized = String(name).trim()
  let ingredient = db.ingredients.find(i => i.name.toLowerCase() === normalized.toLowerCase())
  if (!ingredient) {
    ingredient = { id: db.ingredients.length + 1, name: normalized, unit: unit || 'unit' }
    db.ingredients.push(ingredient)
  } else if (!ingredient.unit && unit) {
    ingredient.unit = unit
  }
  return ingredient
}

// Accept an Excel file upload (multipart/form-data, field name: 'file') and parse BOM rows
app.post('/api/bom/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
    const imported = []
    const skipped = []

    data.forEach((row, index) => {
      const productId = Number(getField(row, 'productId', 'product_id', 'ProductId', 'product id', 'Product ID'))
      const ingredientId = Number(getField(row, 'ingredientId', 'ingredient_id', 'IngredientId', 'ingredient id', 'Ingredient ID'))
      const productName = normalize(getField(row, 'productName', 'ProductName', 'product', 'Product', 'Product Name', 'product name'))
      const ingredientName = normalize(getField(row, 'ingredientName', 'IngredientName', 'ingredient', 'Ingredient', 'Ingredient Name', 'ingredient name'))
      const quantity = Number(getField(row, 'quantity', 'Quantity', 'qty', 'Qty', 'amount', 'Amount'))
      const unit = normalize(getField(row, 'unit', 'Unit', 'UoM', 'uom', 'UOM'))
      const extra = getExtraFields(row)

      let product = null
      let ingredient = null
      if (productId) {
        product = db.products.find(p => p.id === productId)
      }
      if (!product && productName) {
        product = findOrCreateProduct(productName)
      }
      if (ingredientId) {
        ingredient = db.ingredients.find(i => i.id === ingredientId)
      }
      if (!ingredient && ingredientName) {
        ingredient = findOrCreateIngredient(ingredientName, unit)
      }

      if (product && ingredient && !Number.isNaN(quantity)) {
        const bomRow = {
          productId: product.id,
          ingredientId: ingredient.id,
          quantity,
          ...extra
        }
        db.bom.push(bomRow)
        imported.push({
          ...bomRow,
          productName: product.name,
          ingredientName: ingredient.name,
          ingredientUnit: ingredient.unit
        })
      } else {
        skipped.push({ row: index + 1, productId, productName, ingredientId, ingredientName, quantity, unit, ...extra })
      }
    });
    res.json({ ok: true, parsed: data.length, imported, skipped, bom: db.bom });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate aggregated ingredient requirements from current forecast + BOM
app.get('/api/requirements', (req, res) => {
  // join forecast -> bom -> ingredient
  const totals = {};
  db.forecast.forEach(f => {
    const productBom = db.bom.filter(b => b.productId === f.productId);
    productBom.forEach(b => {
      const need = b.quantity * f.quantity;
      totals[b.ingredientId] = (totals[b.ingredientId] || 0) + need;
    });
  });
  // map to ingredient objects
  const result = Object.keys(totals).map(id => {
    const ing = db.ingredients.find(i => i.id === Number(id)) || { id: Number(id), name: 'Unknown', unit: 'unit' };
    return { ingredientId: Number(id), name: ing.name, unit: ing.unit, quantity: totals[id] };
  });
  res.json(result);
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});