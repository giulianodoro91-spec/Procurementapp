const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const xlsx = require('xlsx');
const initialData = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(dbPath);
const upload = multer();

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) return reject(err);
    resolve(this);
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) return reject(err);
    resolve(rows);
  });
});

const normalize = (value) => typeof value === 'string' ? value.trim() : value;

const getField = (row, ...fieldNames) => {
  for (const field of fieldNames) {
    if (field in row && row[field] != null) return row[field];
  }
  return undefined;
};

const normalizeKey = (key) => String(key).trim();

const getExtraFields = (row) => {
  const known = new Set([
    'productId', 'product_id', 'ProductId', 'product id', 'Product ID',
    'productName', 'ProductName', 'product', 'Product', 'Product Name', 'product name',
    'ingredientId', 'ingredient_id', 'IngredientId', 'ingredient id', 'Ingredient ID',
    'ingredientName', 'IngredientName', 'ingredient', 'Ingredient', 'Ingredient Name', 'ingredient name',
    'quantity', 'Quantity', 'qty', 'Qty', 'amount', 'Amount',
    'unit', 'Unit', 'UoM', 'uom', 'UOM',
    'category', 'Category', 'notes', 'Notes', 'productCode', 'ProductCode', 'product code', 'Product Code',
'ingredientCode', 'IngredientCode', 'ingredient code', 'Ingredient Code',
  ]);
  return Object.entries(row).reduce((extra, [key, value]) => {
    if (!known.has(key)) {
      extra[normalizeKey(key)] = value;
    }
    return extra;
  }, {});
};

const findProductById = async (id) => {
  if (!id) return null;
  return await get('SELECT * FROM products WHERE id = ?', [id]);
};

const findProductByCode = async (code) => {
  if (code === undefined || code === null || code === '') return null;
  const normalizedCode = String(code).trim();
  return await get('SELECT * FROM products WHERE lower(code) = lower(?)', [normalizedCode]);
};

const findProductByName = async (name) => {
  if (!name) return null;
  return await get('SELECT * FROM products WHERE lower(name) = lower(?)', [name.trim()]);
};

const createProduct = async (name, code) => {
  const result = await run(
    'INSERT INTO products (code, name) VALUES (?, ?)',
    [code || null, name.trim()]
  );
  return { id: result.lastID, code: code || null, name: name.trim() };
};

const findOrCreateProduct = async (name, code) => {
  const normalized = normalize(name);

  if (!normalized) return null;

  let product = null;

  if (code) {
    product = await findProductByCode(code);
  }

  if (!product) {
    product = await findProductByName(normalized);
  }

  if (!product) {
    product = await createProduct(normalized, code);
  }

  return product;
};

const findIngredientById = async (id) => {
  if (!id) return null;
  return await get('SELECT * FROM ingredients WHERE id = ?', [id]);
};

const findIngredientByCode = async (code) => {
  if (code === undefined || code === null || code === '') return null;
  const normalizedCode = String(code).trim();
  return await get('SELECT * FROM ingredients WHERE lower(code) = lower(?)', [normalizedCode]);
};

const findIngredientByName = async (name) => {
  if (!name) return null;
  return await get('SELECT * FROM ingredients WHERE lower(name) = lower(?)', [name.trim()]);
};

const createIngredient = async (name, unit, code) => {
  const result = await run(
    'INSERT INTO ingredients (code, name, unit) VALUES (?, ?, ?)',
    [code || null, name.trim(), unit || 'unit']
  );
  return { id: result.lastID, code: code || null, name: name.trim(), unit: unit || 'unit' };
};

const findOrCreateIngredient = async (name, unit, code) => {
  const normalized = normalize(name);

  if (!normalized) return null;

  let ingredient = null;

  if (code) {
    ingredient = await findIngredientByCode(code);
  }

  if (!ingredient) {
    ingredient = await findIngredientByName(normalized);
  }

  if (!ingredient) {
    ingredient = await createIngredient(normalized, unit, code);
  } else if (!ingredient.unit && unit) {
    await run(
      'UPDATE ingredients SET unit = ? WHERE id = ?',
      [unit, ingredient.id]
    );

    ingredient.unit = unit;
  }

  return ingredient;
};

const getBomWithNames = async () => {
  return await all(
    `SELECT bom.productId,p.code AS productCode,bom.ingredientId,i.code AS ingredientCode,bom.quantity,
    p.name AS productName,i.name AS ingredientName,i.unit AS ingredientUnit
    FROM bom
    JOIN products p ON p.id = bom.productId
    JOIN ingredients i ON i.id = bom.ingredientId
    ORDER BY bom.id`
  );
};

const initDb = async () => {
await run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL UNIQUE
)`);

await run(`CREATE TABLE IF NOT EXISTS ingredients (
  id INTEGER PRIMARY KEY,
  code TEXT,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'unit'
)`);

  await run(`CREATE TABLE IF NOT EXISTS bom (
    id INTEGER PRIMARY KEY,
    productId INTEGER NOT NULL,
    ingredientId INTEGER NOT NULL,
    quantity REAL NOT NULL,
    FOREIGN KEY(productId) REFERENCES products(id),
    FOREIGN KEY(ingredientId) REFERENCES ingredients(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS forecast (
    id INTEGER PRIMARY KEY,
    productId INTEGER NOT NULL,
    quantity REAL NOT NULL,
    month TEXT
  )`);

  const row = await get('SELECT COUNT(*) AS count FROM products');
  if (row?.count === 0 && initialData.products.length) {
    for (const product of initialData.products) {
      await run(
  'INSERT INTO products (id, code, name) VALUES (?, ?, ?)',
  [product.id, product.code, product.name]
);
    }
    for (const ingredient of initialData.ingredients) {
      await run(
  'INSERT INTO ingredients (id, code, name, unit) VALUES (?, ?, ?, ?)',
  [ingredient.id, ingredient.code, ingredient.name, ingredient.unit]
);
    }
    for (const bomRow of initialData.bom) {
      await run('INSERT INTO bom (productId, ingredientId, quantity) VALUES (?, ?, ?)', [bomRow.productId, bomRow.ingredientId, bomRow.quantity]);
    }
    for (const forecastRow of initialData.forecast) {
      await run('INSERT INTO forecast (productId, quantity, month) VALUES (?, ?, ?)', [forecastRow.productId, forecastRow.quantity, forecastRow.month]);
    }
  }
};

app.get('/', (req, res) => {
  res.send('Procurement App Backend Running');
});

app.get('/api/products', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ingredients', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM ingredients ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bom', async (req, res) => {
  try {
    const rows = await getBomWithNames();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bom/clear', async (req, res) => {
  const full = req.query.full === 'true';
  try {
    await run('DELETE FROM bom');
    if (full) {
      await run('DELETE FROM forecast');
      await run('DELETE FROM products');
      await run('DELETE FROM ingredients');
    }
    res.json({ ok: true, cleared: { bom: true, products: full, ingredients: full, forecast: full } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/forecast', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM forecast ORDER BY id');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/forecast', async (req, res) => {
  const entries = req.body;
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'Array expected' });
  try {
    await run('DELETE FROM forecast');
    for (const entry of entries) {
      const quantity = Number(entry.quantity);
      if (!entry.productId || Number.isNaN(quantity)) continue;
      await run('INSERT INTO forecast (productId, quantity, month) VALUES (?, ?, ?)', [entry.productId, quantity, entry.month || null]);
    }
    const rows = await all('SELECT * FROM forecast ORDER BY id');
    res.json({ ok: true, forecast: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bom/import', async (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows)) return res.status(400).json({ error: 'Array expected' });
  try {
    for (const row of rows) {
      const productId = Number(row.productId);
      const ingredientId = Number(row.ingredientId);
      const quantity = Number(row.quantity);
      if (!productId || !ingredientId || Number.isNaN(quantity)) continue;
      await run('INSERT INTO bom (productId, ingredientId, quantity) VALUES (?, ?, ?)', [productId, ingredientId, quantity]);
    }
    const bomRows = await getBomWithNames();
    res.json({ ok: true, bom: bomRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bom/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
    const imported = [];
    const skipped = [];

    for (const [index, row] of data.entries()) {
      const productId = Number(getField(row, 'productId', 'product_id', 'ProductId', 'product id', 'Product ID'));
      const ingredientId = Number(getField(row, 'ingredientId', 'ingredient_id', 'IngredientId', 'ingredient id', 'Ingredient ID'));
      const productCode = normalize(getField(row, 'productCode', 'ProductCode', 'product code', 'Product Code', 'product_code', 'Product_Code'));
      const ingredientCode = normalize(getField(row, 'ingredientCode', 'IngredientCode', 'ingredient code', 'Ingredient Code', 'ingredient_code', 'Ingredient_Code'));
      const productName = normalize(getField(row, 'productName', 'ProductName', 'product', 'Product', 'Product Name', 'product name'));
      const ingredientName = normalize(getField(row, 'ingredientName', 'IngredientName', 'ingredient', 'Ingredient', 'Ingredient Name', 'ingredient name'));
      const quantity = Number(getField(row, 'quantity', 'Quantity', 'qty', 'Qty', 'amount', 'Amount'));
      const unit = normalize(getField(row, 'unit', 'Unit', 'UoM', 'uom', 'UOM'));
      const extra = getExtraFields(row);

      let product = null;
      let ingredient = null;
if (productCode) {
  product = await findProductByCode(productCode);
}
if (!product && productId) {
  product = await findProductById(productId);
}
if (!product && productName) {
  product = await findOrCreateProduct(productName, productCode);
}

if (ingredientCode) {
  ingredient = await findIngredientByCode(ingredientCode);
}
if (!ingredient && ingredientId) {
  ingredient = await findIngredientById(ingredientId);
}
if (!ingredient && ingredientName) {
  ingredient = await findOrCreateIngredient(
  ingredientName,
  unit,
  ingredientCode
);
}

      if (product && ingredient && !Number.isNaN(quantity)) {
        await run('INSERT INTO bom (productId, ingredientId, quantity) VALUES (?, ?, ?)', [product.id, ingredient.id, quantity]);
        imported.push({
          productId: product.id,
          ingredientId: ingredient.id,
          quantity,
          productCode: product.code,
          ingredientCode: ingredient.code,
          productName: product.name,
          ingredientName: ingredient.name,
          ingredientUnit: ingredient.unit,
          ...extra
        });
      } else {
        skipped.push({ row: index + 1, productId, productName, ingredientId, ingredientName, quantity, unit, ...extra });
      }
    }

    const bomRows = await getBomWithNames();
    res.json({ ok: true, parsed: data.length, imported, skipped, bom: bomRows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requirements', async (req, res) => {
  try {
    const rows = await all(
      `SELECT
  i.id AS ingredientId,
  i.code AS ingredientCode,
  i.name AS name,
  i.unit AS unit, SUM(b.quantity * f.quantity) AS quantity
       FROM forecast f
       JOIN bom b ON b.productId = f.productId
       JOIN ingredients i ON i.id = b.ingredientId
       GROUP BY i.id, i.name, i.unit`
    );
    res.json(rows.map(r => ({
  ingredientId: r.ingredientId,
  ingredientCode: r.ingredientCode,
  name: r.name,
  unit: r.unit,
  quantity: r.quantity || 0
})));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDb()
  .then(() => {
    app.listen(3001, () => {
      console.log('Server running on port 3001');
    });
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
