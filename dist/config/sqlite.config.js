"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = process.env.DATABASE_PATH || path_1.default.join(__dirname, '../../bhair.db');
const db = new better_sqlite3_1.default(dbPath, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    fileMustExist: true
});
// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
console.log('✅ Connected to SQLite:', dbPath);
exports.default = db;
