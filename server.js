require("dotenv").config();
const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

for (const key of ["DATABASE_URL", "JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD_HASH"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Check your .env file.`);
    process.exit(1);
  }
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

  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM products");
  if (rows[0].count === 0) {
    const defaults = {
      NETFLIX: [["BASIC","Rp5.000",true],["VIP","Rp10.000",true],["RESELLER","Rp25.000",true]],
      CANVA: [["BASIC","Rp5.000",true],["VIP","Rp10.000",true]],
      "ALIGHT MOTION": [["VIP 1 TAHUN","Rp2.000",true],["GENERATOR APK","Rp15.000",true]]
    };
    let po = 0;
    for (const [pname, tiers] of Object.entries(defaults)) {
      const p = await pool.query("INSERT INTO products(name,sort_order) VALUES($1,$2) RETURNING id",[pname,po++]);
      let to = 0;
      for (const [name,price,stock] of tiers) {
        await pool.query("INSERT INTO tiers(product_id,name,price,stock,sort_order) VALUES($1,$2,$3,$4,$5)",
          [p.rows[0].id,name,price,stock,to++]);
      }
    }
  }
}

function auth(req,res,next) {
  const token = (req.headers.authorization || "").replace(/^Bearer /,"");
  if (!token) return res.status(401).json({error:"Unauthorized"});
  try { req.user = jwt.verify(token,process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({error:"Sesi login sudah habis."}); }
}

app.get("/api/products", async (req,res)=>{
  try {
    const {rows} = await pool.query(`
      SELECT p.name AS product_name,t.id,t.name AS tier_name,t.price,t.stock
      FROM products p LEFT JOIN tiers t ON t.product_id=p.id
      ORDER BY p.sort_order,t.sort_order
    `);
    const out={};
    for(const r of rows){
      if(!out[r.product_name]) out[r.product_name]=[];
      if(r.id) out[r.product_name].push({id:r.id,name:r.tier_name,price:r.price,stock:r.stock});
    }
    res.json(out);
  } catch(e){ console.error(e); res.status(500).json({error:"Database error"}); }
});

app.post("/api/login", async (req,res)=>{
  const {email,password}=req.body||{};
  if(email!==process.env.ADMIN_EMAIL) return res.status(401).json({error:"Email atau password salah."});
  const ok=await bcrypt.compare(password||"",process.env.ADMIN_PASSWORD_HASH);
  if(!ok) return res.status(401).json({error:"Email atau password salah."});
  const token=jwt.sign({email,role:"admin"},process.env.JWT_SECRET,{expiresIn:"8h"});
  res.json({token});
});

app.put("/api/tiers/:id",auth,async(req,res)=>{
  const {name,price,stock}=req.body||{};
  if(!name||!price||typeof stock!=="boolean") return res.status(400).json({error:"Data tidak lengkap."});
  try{
    const r=await pool.query("UPDATE tiers SET name=$1,price=$2,stock=$3 WHERE id=$4 RETURNING id,name,price,stock",
      [name.trim(),price.trim(),stock,req.params.id]);
    if(!r.rowCount) return res.status(404).json({error:"Tier tidak ditemukan."});
    res.json(r.rows[0]);
  }catch(e){console.error(e);res.status(500).json({error:"Database error"});}
});

app.delete("/api/tiers/:id",auth,async(req,res)=>{
  try{
    const r=await pool.query("DELETE FROM tiers WHERE id=$1",[req.params.id]);
    if(!r.rowCount) return res.status(404).json({error:"Tier tidak ditemukan."});
    res.json({ok:true});
  }catch(e){console.error(e);res.status(500).json({error:"Database error"});}
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

initDb().then(()=>app.listen(PORT,()=>console.log(`NDREX running on port ${PORT}`)))
.catch(e=>{console.error(e);process.exit(1);});
