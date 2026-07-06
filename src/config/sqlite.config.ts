import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Determine database path from environment or use default
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'bhair.db');

// Check if database file exists, if not create it
import { startupLog } from '../utils/logger';

if (!fs.existsSync(dbPath)) {
    startupLog('⚠️ Database file not found, creating new database at:', dbPath);
}

// Create SQLite connection (fileMustExist: false to allow creation)
const db = new Database(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    fileMustExist: false // Allow creating new db file if not exists
});

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

startupLog('✅ SQLite connected:', dbPath);

export default db;
