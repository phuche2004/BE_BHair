import Database from 'better-sqlite3';
import path from 'path';

// Determine database path from environment or use default
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'bhair.db');

// Create SQLite connection
const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    fileMustExist: true
});

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('✅ SQLite connected:', dbPath);

export default db;
