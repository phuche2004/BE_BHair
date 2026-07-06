"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Determine database path from environment or use default
const dbPath = process.env.DATABASE_PATH || path_1.default.join(process.cwd(), 'bhair.db');
// Check if database file exists, if not create it
const logger_1 = require("../utils/logger");
if (!fs_1.default.existsSync(dbPath)) {
    (0, logger_1.startupLog)('⚠️ Database file not found, creating new database at:', dbPath);
}
// Create SQLite connection (fileMustExist: false to allow creation)
const db = new better_sqlite3_1.default(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    fileMustExist: false // Allow creating new db file if not exists
});
// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
(0, logger_1.startupLog)('✅ SQLite connected:', dbPath);
exports.default = db;
