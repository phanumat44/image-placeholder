
const express = require('express');
const { url } = require('inspector');
const multer = require('multer');
const path = require('path');
const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(express.static('public'));

const storage = multer.diskStorage({
    destination: './uploads/', // Directory where the files will be stored
    filename: function (req, file, cb) {
        let ext = path.extname(file.originalname);

        // If file has no extension, infer from MIME type or add a default extension
        if (!ext) {
            const mimeTypes = {
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'application/pdf': '.pdf',
                'text/plain': '.txt',
                // Add other MIME types as needed
            };

            ext = mimeTypes[file.mimetype] || ''; // Default to empty if unknown
        }

        cb(null, file.fieldname + '-' + Date.now() + ext);
    }
});

// Initialize upload variable
const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB file size limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('image'); // 'image' is the name of the input field

// Check file type
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype) {
        return cb(null, true);
    } else {
        cb('Error: Unsupported file type!');
    }
}

// Route to upload the file
app.post('/upload', (req, res) => {
    console.time('upload');
    upload(req, res, async (err) => {
        if (err) {
            res.status(400).json({ message: err });
        } else {
            if (req.file == undefined) {
                res.status(400).json({ message: 'No file selected!' });
            } else {
                // Call the scrap function
                const innerHtml =   await scrap(`uploads/${req.file.filename}`);
                console.timeEnd('upload');
                res.status(200).json({
                    message: 'File uploaded successfully!',
                    file: `./uploads/${req.file.filename}`,
                    url: innerHtml
                });
            }
        }
    });
});


// Start the server
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const scrap = async (filePath) => {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/google-chrome-stable',
    });
    const page = await browser.newPage();
    await page.goto('https://postimages.org/th/', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#ddinput');
    await page.click('#ddinput');

    console.log(path.resolve(__dirname, filePath));
    
    const imgPath = path.resolve(__dirname, filePath);

    const fileInputSelector = 'input[type="file"]';
    await page.waitForSelector(fileInputSelector);
    // Upload the file
    const [fileInput] = await page.$$(fileInputSelector);
    await fileInput.uploadFile(imgPath);

    // wait 5s for the image to upload
    //await setTimeout(() => {}, 2000);


    await page.waitForSelector('#content > div.container > div > div.col-sm-3.col-md-2.thumb-container');


    const innerHtml = await page.$eval('#code_direct', el => el.value);

    console.log(innerHtml);

    console.log('Scraping done!');
    await browser.close();

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting the file:', err);
        } else {
            console.log('File deleted successfully');
        }
    });

    axios.get(innerHtml)
        .then((response) => {
            if (response.status === 200) {
                console.log('OK');
            }
         
        });

    
    return innerHtml;
    
};