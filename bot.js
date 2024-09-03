const puppeteer = require('puppeteer');

const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
});
const page = await browser.newPage();
await page.goto('https://postimages.org/th/', { waitUntil: 'networkidle0' });