require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) {
  console.error("Missing required environment variables. Copy .env.example to .env and fill them in.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tiers (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      price VARCHAR(50) NOT NULL,
      stock BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  const count = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  if (count.rows[0].count === 0) {
    const defaults = {
      NETFLIX: [
        ["BASIC", "Rp5.000", true],
        ["VIP", "Rp10.000", true],
        ["RESELLER", "Rp25.000", true]
      ],
      CANVA: [
        ["BASIC", "Rp5.000", true],
        ["VIP", "Rp10.000", true]
      ],
      "ALIGHT MOTION": [
        ["VIP 1 TAHUN", "Rp2.000", true],
        ["GENERATOR APK", "Rp15.000", true]
      ]
    };

    let productOrder = 0;
    for (const [productName, tiers] of Object.entries(defaults)) {
      const product = await pool.query(
        "INSERT INTO products(name, sort_order) VALUES($1,$2) RETURNING id",
        [productName, productOrder++]
      );
      let tierOrder = 0;
      for (const [name, price, stock] of tiers) {
        await pool.query(
          "INSERT INTO tiers(product_id,name,price,stock,sort_order) VALUES($1,$2,$3,$4,$5)",
          [product.rows[0].id, name, price, stock, tierOrder++]
        );
      }
    }
  }
}

function signToken() {
  return jwt.sign({ email: process.env.ADMIN_EMAIL, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "8h" });
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id AS product_id, p.name AS product_name, p.sort_order AS product_order,
             t.id AS tier_id, t.name AS tier_name, t.price, t.stock, t.sort_order AS tier_order
      FROM products p
      LEFT JOIN tiers t ON t.product_id = p.id
      ORDER BY p.sort_order, t.sort_order
    `);

    const products = {};
    for (const row of result.rows) {
      if (!products[row.product_name]) products[row.product_name] = [];
      if (row.tier_id) {
        products[row.product_name].push({
          id: row.tier_id,
          name: row.tier_name,
          price: row.price,
          stock: row.stock
        });
      }
    }
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email dan password wajib diisi." });
  if (email !== process.env.ADMIN_EMAIL) return res.status(401).json({ error: "Email atau password salah." });

  const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!valid) return res.status(401).json({ error: "Email atau password salah." });

  res.json({ token: signToken() });
});

app.put("/api/tiers/:id", requireAdmin, async (req, res) => {
  const { name, price, stock } = req.body || {};
  if (!name || !price || typeof stock !== "boolean") {
    return res.status(400).json({ error: "Data tier tidak lengkap." });
  }

  try {
    const result = await pool.query(
      "UPDATE tiers SET name=$1, price=$2, stock=$3 WHERE id=$4 RETURNING id,name,price,stock",
      [name.trim(), price.trim(), stock, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Tier tidak ditemukan." });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/tiers", requireAdmin, async (req, res) => {
  const { productName, name, price, stock = true } = req.body || {};
  if (!productName || !name || !price) return res.status(400).json({ error: "Data wajib diisi." });

  try {
    const product = await pool.query("SELECT id FROM products WHERE name=$1", [productName]);
    if (!product.rowCount) return res.status(404).json({ error: "Produk tidak ditemukan." });

    const result = await pool.query(
      `INSERT INTO tiers(product_id,name,price,stock,sort_order)
       VALUES($1,$2,$3,$4,COALESCE((SELECT MAX(sort_order)+1 FROM tiers WHERE product_id=$1),0))
       RETURNING id,name,price,stock`,
      [product.rows[0].id, name.trim(), price.trim(), stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/tiers/:id", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM tiers WHERE id=$1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Tier tidak ditemukan." });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

initDb()
  .then(() => app.listen(PORT, () => console.log(`NDREX running on port ${PORT}`)))
  .catch(err => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
