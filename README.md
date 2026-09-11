# NDREX PROJECT — Full Stack

Stack:
- Node.js + Express
- PostgreSQL
- JWT admin session
- bcrypt password hashing
- Existing dark-night storefront in `public/`

## 1. Install
```bash
npm install
```

## 2. Configure
Copy `.env.example` to `.env`.

Generate a password hash:
```bash
node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('GANTI_PASSWORD_KAMU',12).then(console.log)"
```
Put the resulting hash into `ADMIN_PASSWORD_HASH`.

Set `DATABASE_URL` to your PostgreSQL connection string and create a long random `JWT_SECRET`.

## 3. Run
```bash
npm start
```

Open:
http://localhost:3000

## API
- GET `/api/products` — public product data
- POST `/api/login` — admin login
- PUT `/api/tiers/:id` — edit tier (admin)
- POST `/api/tiers` — add tier (admin)
- DELETE `/api/tiers/:id` — delete tier (admin)

The included frontend is a starter storefront. The database/API are ready for wiring the admin UI to live data.
