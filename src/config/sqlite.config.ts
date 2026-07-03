import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../bhair.db');

const db = new Database(dbPath, { 
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
  fileMustExist: true 
});

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('✅ Connected to SQLite:', dbPath);

export default db;
