'use strict';
// Auto-initialization: creates the database, tables, and seed data on
// first run so the system works out-of-the-box after a fresh clone.
const fs = require('fs');
const path = require('path');

const DB_NAME = process.env.DB_NAME || 'rcc_aps';

async function init() {
  const mysql = require('mysql2/promise');

  // Step 1: Connect without selecting a database
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4'
  });

  try {
    // Step 2: Create database if not exists
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`[MySQL] Database "${DB_NAME}" ready.`);
  } finally {
    await conn.end();
  }

  // Step 3: Run schema.sql (CREATE TABLE IF NOT EXISTS for all tables)
  const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
    charset: 'utf8mb4'
  });
  const poolConn = await pool.getConnection();

  try {
    // Strip SQL comments, then split into statements
    const clean = schema
      .split(/\r?\n/)
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    const statements = clean
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await poolConn.query(stmt);
    }
    console.log(`[MySQL] Schema applied (${statements.length} statements).`);
  } finally {
    poolConn.release();
  }

  // Step 4: Check if users table is empty → seed if needed
  const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM users');
  if (rows[0].cnt > 0) {
    console.log(`[MySQL] Users table has ${rows[0].cnt} records — skipping seed.`);
    await pool.end();
    return { created: true, seeded: false };
  }

  // Step 5: Load seed data and persist
  const seedPath = path.join(__dirname, 'seed.json');
  if (!fs.existsSync(seedPath)) {
    console.warn('[MySQL] seed.json not found — skipping seed data.');
    await pool.end();
    return { created: true, seeded: false };
  }

  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  const db = require('../db');
  await db.persistState(seed);
  console.log(`[MySQL] Seed data loaded: ${seed.users.length} users, ${seed.sssTable.length} SSS brackets, ${seed.birData.length} BIR brackets.`);

  await pool.end();
  return { created: true, seeded: true };
}

module.exports = { init };
