import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const NEON_CONNECTION_STRING =
  "postgresql://neondb_owner:npg_mvUaus0KG9QV@ep-long-grass-azs1vn6a-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

let connectionString = process.env.DATABASE_URL || NEON_CONNECTION_STRING;

// Đảm bảo luôn có sslmode=require ở cuối chuỗi
if (!connectionString.includes("sslmode=")) {
  connectionString += (connectionString.includes("?") ? "&" : "?") + "sslmode=require";
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;