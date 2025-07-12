import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Pool } = pg;
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("Available environment variables:", Object.keys(process.env).filter(key => key.includes('DATABASE')));
  console.error("Current working directory:", process.cwd());
  console.error("Looking for .env file at:", process.cwd() + "/.env");
  
  throw new Error(
    "DATABASE_URL must be set. Please check:\n" +
    "1. .env file exists in project root\n" +
    "2. .env file contains: DATABASE_URL=postgresql://...\n" +
    "3. No extra spaces around the = sign\n" +
    "4. Run from the project root directory"
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
export const db = drizzle(pool, { schema });
