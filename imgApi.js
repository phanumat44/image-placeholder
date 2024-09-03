const { createCanvas } = require('canvas');
const express = require('express');
const app = express();
const port = 2000;

// Function to create an image and return it as a buffer
function createImage(width, height, text) {
    // Create a canvas and get its context
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fill the background with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Set text properties
    ctx.fillStyle = 'black';
    ctx.font = `${width / 10}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text in the center of the canvas
    ctx.fillText(text, width / 2, height / 2);

    // Return the image as a buffer
    return canvas.toBuffer('image/png');
}

// API endpoint to generate an image
app.get('/genpic', (req, res) => {
    const width = parseInt(req.query.w, 10) || 300; // Default width
    const height = parseInt(req.query.h, 10) || 500; // Default height
    const text = req.query.t || `${width}x${height}`; // Default text

    if (isNaN(width) || isNaN(height)) {
        return res.status(400).send('Invalid width or height.');
    }

    try {
        const imageBuffer = createImage(width, height, text);
        res.set('Content-Type', 'image/png');
        res.send(imageBuffer);
    } catch (err) {
        res.status(500).send('Error generating image.');
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});