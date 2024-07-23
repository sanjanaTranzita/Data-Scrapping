const puppeteer = require('puppeteer');
const TARGET_URL = 'https://www.myntra.com/n-and-j?f=Categories%3AShirts&rawQuery=N%20And%20J&p='
let allProductUrls = []

async function main() {
    const browser = await puppeteer.launch({headless: 'new'});
    const tab = await browser.newPage();
    await tab.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await tab.goto(TARGET_URL)
    let pagesCount = await getPagesCount(tab);

    for (let pageIndex = 1; pageIndex <= pagesCount; pageIndex++) {
        let pageUrl = TARGET_URL + pageIndex.toString()
        let productUrls = await getProductsonPage(tab, TARGET_URL + pageIndex.toString());
        let data = {
            'storefront' : TARGET_URL,
            'total_pages': pagesCount,
            'current_page': pageIndex,
            'current_page_url': pageUrl,
            'page_urls' : productUrls,
            'is_completed': true,
        }
        allProductUrls = allProductUrls.concat(data)
        }
    await browser.close();
    console.log("Total Size of allProductUrls"," \n allProductUrls --> ",allProductUrls);
    }

async function getPagesCount(page){
    const parentElement = await page.$('.pagination-container');
    const childElements = await parentElement.$$('li');
    const count = await childElements.slice(-2)[0].evaluate(element => element.textContent);
    console.log("Count: ", count);
    return Number(count);
}

async function getProductsonPage(tab, url) {
    await tab.goto(url);
    const parentElement = await tab.$('.results-base');
    if(parentElement != null){
        const productUrls = await parentElement.$$eval('[target="_blank"]', elements => elements.map(element => "https://www.myntra.com/" + element.getAttribute("href")));
        return productUrls;

    }
    return '';
}
main();

