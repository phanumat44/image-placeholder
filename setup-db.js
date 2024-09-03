const sqlite3 = require('sqlite3').verbose();

// Open or create the SQLite database
const db = new sqlite3.Database('./api_keys.db');

// Create a table to store API keys
db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        description TEXT,
        expires_at TEXT
    )
`);