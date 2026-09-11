# NDREX PROJECT — Full Stack Fixed

## Admin demo
- Email: `admin@ndrex.com`
- Password: `ndrex123`

Run `node setup-admin.js` once to generate `.env` with a bcrypt hash and random JWT secret.
Then replace `DATABASE_URL` in `.env` with your PostgreSQL connection string.

## Run
```bash
npm install
node setup-admin.js
npm start
```

The storefront keeps the original:
- Slide 1 typing animation: NDREX PROJECT
- Click slide 1 to enter
- Netflix / Canva / Alight Motion product cards
- Tier pricing
- Payment modal

Admin changes are stored in PostgreSQL.
