const timers = require("timers");

const puppeteer = require('puppeteer');
let xlsx = require("json-as-xlsx");
const {log} = require("console");

(async () => {
    const browser = await puppeteer.launch({
        headless: false, defaultViewport: null, args: ['--start-maximized']
    });
    const page = await browser.newPage();
    await page.goto('https://www.meesho.com/RNAFASHION?_ms=3.0.1&page=1'); 

    async function getPaginationInfo() {
        return await page.evaluate(() => {
            const paginationElements = document.querySelectorAll('.Pagination__PaginationStyled-sc-hrohhc-0 .sc-jRwbcX');
            const pageNumbers = Array.from(paginationElements).map(el => el.id);
            const nextButton = document.querySelector('#next');
            return {
                pageNumbers: pageNumbers,
                nextButtonExists: !!nextButton,
            };
        });
    }

    async function scrapeCurrentPage() {
        // Add your scraping logic here for the current page
        console.log('Scraping page:', await page.evaluate(() => document.location.href));
    }

    while (true) {
        await scrapeCurrentPage();
        const paginationInfo = await getPaginationInfo();
        if (paginationInfo.nextButtonExists) {
            await page.click('#next');
            await page.waitForNavigation({ waitUntil: 'networkidle0' }); // Adjust the wait condition if necessary
        } else {
            break;
        }
    }

    await browser.close();
})();
