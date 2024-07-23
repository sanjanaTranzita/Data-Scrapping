const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');


const csvFilePath = 'google-map-crawler/pincode.csv';
const TARGET_URL = 'https://www.google.com/maps/@26.875805,81.0202426,15z?authuser=0&entry=ttu';

async function main() {
    const browser = await puppeteer.launch({ headless: "new" });
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1920, height: 1080 });
    await tab.goto(TARGET_URL);

    // Wait for the search input field to appear on the page
    await tab.waitForSelector('input[name="q"]');

    // Call the crawlMap function after the page is fully loaded
    await crawlMap(tab);

    await browser.close();
};

async function crawlMap(page) {
    try {
        const pins = await getPins();

        console.log("pins", pins);

        for (let i = 0; i < pins.length; i++) {
            await page.waitForTimeout(1000);
            await page.type('input[name="q"]', pins[i]);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(5000);
            const currentURL = await page.url();
            await page.type('input[name="q"]',"");
            console.log('Current URL:', currentURL.split("/")[6]);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function getPins() {
    return new Promise((resolve, reject) => {
        const pinArr = [];
        const stream = fs.createReadStream(csvFilePath);

        stream.pipe(csv())
            .on('data', (row) => {
                pinArr.push(row['Pincode']);
            })
            .on('end', () => {
                console.log('CSV file processing finished.');
                resolve(pinArr);
            })
            .on('error', (err) => {
                console.error('Error occurred while processing CSV:', err);
                reject(err);
            });
    });
}

main();
