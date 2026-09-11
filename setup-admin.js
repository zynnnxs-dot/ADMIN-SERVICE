const fs=require("fs");
const bcrypt=require("bcryptjs");
const crypto=require("crypto");
const password="ndrex123";
const hash=bcrypt.hashSync(password,12);
const secret=crypto.randomBytes(32).toString("hex");
const env=`PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
JWT_SECRET=${secret}
ADMIN_EMAIL=admin@ndrex.com
ADMIN_PASSWORD_HASH=${hash}
`;
fs.writeFileSync(".env",env);
console.log("Created .env");
console.log("Admin email: admin@ndrex.com");
console.log("Admin password: ndrex123");
console.log("Now replace DATABASE_URL in .env with your PostgreSQL connection string.");
