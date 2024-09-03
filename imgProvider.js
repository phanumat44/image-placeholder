const dayjs = require('dayjs'); // For date handling

const { createCanvas } = require('canvas');

const express = require('express');

const app = express();

const port = 2000;

const sqlite3 = require('sqlite3').verbose();

// Open or create the SQLite database
const db = new sqlite3.Database('./api_keys.db');

// Create a table to store API keys
db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        description TEXT
    )
`);

// utility function 

function generateApiKey() {
    return require('crypto').randomBytes(16).toString('hex');
}
function createImage(width, height, text,bg,color) {
    // Create a canvas and get its context
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill the background with white
    ctx.fillStyle = "#"+bg || 'white';
    ctx.fillRect(0, 0, width, height);

    // Set text properties
    ctx.fillStyle = "#"+color||'black';
    ctx.font = `${width / 10}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text in the center of the canvas
    ctx.fillText(text, width / 2, height / 2);

    // Return the image as a buffer
    return canvas.toBuffer('image/png');
}

// Middleware to check API key
function validateApiKey(req, res, next) {
    const apiKey = req.query.api_key;

    if (!apiKey) {
        return res.status(401).send('API key is missing.');
    }

    db.get('SELECT * FROM api_keys WHERE key = ?', [apiKey], (err, row) => {
        if (err) {
            return res.status(500).send('Error checking API key.');
        }

        if (!row) {
            return res.status(403).send('Invalid API key.');
        }

        if (row.expires_at && dayjs().isAfter(row.expires_at)) {
            return res.status(403).send('API key has expired.');
        }

        next();
    });
}




app.post('/generate-key', (req, res) => {
    const apiKey = generateApiKey();
    const description =  'No description';
    const expiryOption =  'permanent';

    let expiresAt = null;

    switch (expiryOption) {
        case '7d':
            expiresAt = dayjs().add(7, 'day').toISOString();
            break;
        case '1m':
            expiresAt = dayjs().add(1, 'month').toISOString();
            break;
        case '1y':
            expiresAt = dayjs().add(1, 'year').toISOString();
            break;
        case 'permanent':
            expiresAt = null;
            break;
        default:
            return res.status(400).send('Invalid expiry option.');
    }

    db.run('INSERT INTO api_keys (key, description, expires_at) VALUES (?, ?, ?)', [apiKey, description, expiresAt], function (err) {
        if (err) {
            return res.status(500).send('Error generating API key.');
        }

        res.send({ apiKey, expiresAt });
    });
});

app.get('/check-key-expiry', (req, res) => {
    const apiKey = req.query.api_key;

    if (!apiKey) {
        return res.status(400).send('API key is missing.');
    }

    db.get('SELECT expires_at FROM api_keys WHERE key = ?', [apiKey], (err, row) => {
        if (err) {
            return res.status(500).send('Error checking API key.');
        }

        if (!row) {
            return res.status(403).send('Invalid API key.');
        }

        if (!row.expires_at) {
            return res.send({ apiKey, expiresAt: 'Never (Permanent)' });
        }

        const isExpired = dayjs().isAfter(row.expires_at);
        res.send({
            apiKey,
            expiresAt: row.expires_at,
            expired: isExpired
        });
    });
});


// 


app.get('/genpic', validateApiKey, (req, res) => {
    const width = parseInt(req.query.w, 10) || 300;
    const height = parseInt(req.query.h, 10) || 500;
    const bg = req.query.bg|| "fff";
    const color = req.query.color|| "000";
    const text = req.query.t || `${width}x${height}`;

    if (isNaN(width) || isNaN(height)) {
        return res.status(400).send('Invalid width or height.');
    }

    try {
        const imageBuffer = createImage(width, height, text, bg,color);
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (err) {
        res.status(500).send('Error generating image.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
