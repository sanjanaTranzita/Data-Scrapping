const timers = require("timers");

const puppeteer = require('puppeteer');
let xlsx = require("json-as-xlsx");
const {log} = require("console");

// const TARGET_URL = 'https://www.meesho.com/FOURTHREADS?_ms=2&page='
// const TARGET_URL_FIRSTPAGE = 'https://www.meesho.com/FOURTHREADS?_ms=2&page=1'
const TARGET_URL = 'https://www.meesho.com/RNAFASHION?_ms=3.0.1&page='
const TARGET_URL_FIRSTPAGE = 'https://www.meesho.com/RNAFASHION?_ms=3.0.1&page=1'


async function main() {
    const browser = await puppeteer.launch({
        headless: false, defaultViewport: null, args: ['--start-maximized']
    });
    let catalogue = [];
    // get page count
    const tab = await browser.newPage();
    await tab.setViewport({width: 1920, height: 1080});
    await tab.goto(TARGET_URL_FIRSTPAGE);
    await tab.waitForTimeout(2000);
    let pagesCount = await getPagesCount(tab);
    console.log('total pages : ', pagesCount);
    for (let pageIndex = 1; pageIndex <= pagesCount; pageIndex++) {
        console.log("Page Index:", pageIndex);
        // await tab.waitForTimeout(2000);
        let productUrls = await getProductsonPage(tab, TARGET_URL + pageIndex.toString());
        // await tab.waitForTimeout(3000);
        // for (const productUrl of productUrls.slice(0, 3)){
        for (const productUrl of productUrls) {
            let product_details = await parseProductPage(tab, productUrl);
            catalogue.push(product_details);
        }
    }

    //await tab.screenshot({path: 'example.png'});
    console.log(catalogue);
    dump(catalogue);
    await browser.close();
}


async function getPagesCount(page) {
    while (true) {
        const nextButton = await page.$('button#next');
        if (!nextButton) {
            break;
        }
        await nextButton.click();
        await page.waitForTimeout(1000); // wait for the page to load
    }
    const currentPage = await page.$('div.Pagination__PaginationStyled-sc-hrohhc-0.kGXcBd div.sc-jRwbcX.hHxA-dT span');
    const pageCount = await page.evaluate(element => element.textContent, currentPage);
    return parseInt(pageCount);
}

async function getProductsonPage(tab, url) {
    await tab.goto(url);
    await tab.waitForTimeout(3000);
    console.log("getProductsonPage called!")
    // const xpath = '/html/body/div/div[3]/div/div[4]/div/div/div/div/div/div[3]/div[2]/div[2]/div';

    // productUrls = await tab.$$eval('html > body > div > div:nth-child(3) > div > div:n
    // th-child(4) > div > div > div > div > div > div:nth-child(3) > div  a', elements => elements.map(element => element.href));
    const productUrls = await tab.$$eval('.ProductList__GridCol-sc-8lnc8o-0 a', elements => elements.map(element => element.href));
    console.log("line no 58 ", productUrls, productUrls.length);
    return productUrls


}

async function parseProductPage(tab, url) {

    console.log('parsing ', url);
    // url='https://www.flipkart.com/icchit-fal-georgette-embroidered-salwar-suit-material/p/itm396955a135a3c?pid=FABGJ9HWXF2ENPQY&lid=LSTFABGJ9HWXF2ENPQYW2IHKM&marketplace=FLIPKART&store=clo%2Fqfi%2Fxcx%2Fms4&srno=b_9_321&otracker=product_breadCrumbs_ICCHIT%20FAL%20Women%27s%20Dress%20Materials&fm=organic&iid=e8b0de2f-ab58-44c7-824a-0e49b2482aa5.FABGJ9HWXF2ENPQY.SEARCH&ppt=browse&ppn=browse';
    await tab.goto(url);
    const ProdElements = await tab.$x('//*[@id="__next"]/div[3]/div/div[2]/div[1]/span');
    let productName = "NA"
    if (ProdElements.length > 0) {
        productName = await tab.evaluate(element => element.textContent, ProdElements[0]);
    } else {
        console.log('Element not found.');
    }
    const priceElements = await tab.$x('//*[@id="__next"]/div[3]/div/div[2]/div[1]/div[1]/h4');
    let price = "NA"
    if (priceElements.length > 0) {
        price = await tab.evaluate(element => element.textContent, priceElements[0]);
    } else {
        console.log('Element not found.');
    }
    const sizeElements = await tab.$x('//*[@id="__next"]/div[3]/div/div[2]/div[2]/div/div/span');
    let size = [];

    if (sizeElements.length > 0) {
        size = await Promise.all(sizeElements.map(async (element) => {
            const spanText = await tab.evaluate((el) => el.textContent, element);
            return spanText.trim();
        }));
    } else {
        console.log('Element not found.');
    }
    const imgElements = await tab.$x('//*[@id="__next"]/div[3]/div/div[1]/div/div[1]/div/div//img');
    let imgSrcList = [];

    if (imgElements.length > 0) {
        imgSrcList = await Promise.all(imgElements.map(async (element) => {
            const src = await element.evaluate((el) => el.getAttribute('src').replace("_64.webp","_512.webp"));
            return src;
        }));
    } else {
        console.log('No img elements found.');
    }
    const shortDescElement = await tab.$x('//*[@id="__next"]/div[3]/div/div[2]/div[3]/div');

    // Fetch the outer HTML
    const shortDescOuterHTML = await tab.evaluate(element => element.outerHTML, shortDescElement[0]);
    let manf_detail="NA";
    let packer_detail="NA";
    let impoter_detail="NA";
    try {
        const mipElements = await tab.$x('//*[@id="__next"]/div[3]/div/div[2]/div[3]/div/span');
        if (mipElements.length > 0) {
            const mipElement = mipElements[0];
            await mipElement.click();
            console.log("=============================>MIP Element clicked");
            await tab.waitForTimeout(3000);
            console.log("3 sec timout complete");
            const manufacturerElement = await tab.$x('/html/body/div[2]/div[2]/div[3]/div/div[1]/span[2]');
            if (manufacturerElement.length > 0) {
                manf_detail = await tab.evaluate(element => element.textContent, manufacturerElement[0]);
                console.log("manf_detail=> ", manf_detail);
            } else {
                console.log('Element not found.');
            }
            const importerElement = await tab.$x('/html/body/div[2]/div[2]/div[3]/div/div[2]/span[2]');
            if (importerElement.length > 0) {
                impoter_detail = await tab.evaluate(element => element.textContent, importerElement[0]);
                console.log("impoter_detail=> ", impoter_detail);
            } else {
                console.log('Element not found.');
            }
            const packerElement = await tab.$x('/html/body/div[2]/div[2]/div[3]/div/div[3]/span[2]');
            if (packerElement.length > 0) {
                packer_detail = await tab.evaluate(element => element.textContent, packerElement[0]);
                console.log("impoter_detail=> ", packer_detail);
            } else {
                console.log('Element not found.');
            }


        } else {
            console.log("==============================>MIP Element not found");
        }


    }
    catch (e) {
        console.log("error occur on mip element",e);
    }


    console.log("product name:", productName, "\n", "Price:", price.match(/\d+/g)[0].toString(), "\n", "size:", size,"\n","img:",imgSrcList,"\n","manf_detail:",manf_detail);


    return {
        'super_category': '',
        'category': '',
        'sub_category': '',
        'sub_sub_category': '',
        'brand': 'NA',
        'product_name': productName,
        'price': price.match(/\d+/g)[0].toString() > 0 ? price.match(/\d+/g)[0].toString() : "NA",
        'mrp': price.match(/\d+/g)[0].toString() > 0 ? price.match(/\d+/g)[0].toString() : "NA",
        'size': size.length > 0 ? size.toString() : "NA",
        'manuf_detail': manf_detail ? manf_detail.toString() : "NA",
        'packer_detail': packer_detail ? packer_detail.toString() : "NA",
        'importer_detail': impoter_detail ? impoter_detail.toString() : "NA",
        'fabric': "NA",
        'short_desc': shortDescOuterHTML ? shortDescOuterHTML.toString().slice(0, 32766) : "", // 'long_desc': longDesc?longDesc.toString().slice(0,32767):"",
        'images': imgSrcList.toString(),
        'discount': '0',
        'color': "NA",
        'prod_code': 'not avilable',
        'spec': "{}",
        'variants': JSON.stringify({
            "size":size
        })
    }

}

function dump(catalogue) {
    let data = [{
        sheet: "Catalogue", columns: [{label: "super_category", value: "super_category"}, {
            label: "category", value: "category"
        }, {label: "sub_category", value: "sub_category"}, {
            label: "sub_sub_category", value: "sub_sub_category"
        }, {label: "brand", value: "brand"}, {label: "prod_code", value: "prod_code"}, {
            label: "product_name", value: "product_name"
        }, {label: "price", value: "price"}, {label: "mrp", value: "mrp"}, {
            label: "manuf_detail", value: "manuf_detail"
        }, {label: "packer_detail", value: "packer_detail"}, {
            label: "importer_detail", value: "importer_detail"
        }, {label: "discount", value: "discount"}, {label: "size", value: "size"}, {
            label: "fabric", value: "fabric"
        }, {label: "short_desc", value: "short_desc"}, {label: "long_desc", value: "long_desc"}, {
            label: "color", value: "color"
        }, {label: "specification", value: "spec"}, {label: "images", value: "images"}, {
            label: "variants", value: "variants"
        }// Run functions
        ], content: catalogue,
    }];

    let settings = {
        fileName: "RNFashion", // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    }

    xlsx(data, settings);
}
async function getAPIResponse(page, apiURL) {
    return new Promise(async (resolve, reject) => {
        let desiredResponse = null;

        // Enable request interception
        await page.setRequestInterception(true);

        // Capture the desired API response
        page.on('response', async (response) => {
            const url = response.url();

            // Check if the response URL matches the desired API
            if (url === apiURL) {
                const request = response.request();

                // Ignore preflight requests
                if (request.method() !== 'OPTIONS') {
                    desiredResponse = await response.json();
                    resolve(desiredResponse);
                }
            }
        });

        // Custom action to trigger the API request
        await page.evaluate(() => {
            // Trigger the API request here (e.g., clicking a button, submitting a form, etc.)
            // Example: document.querySelector('button#your-button-selector').click();
        });

        // Wait for the desired API response
        while (desiredResponse === null) {
            await page.waitForTimeout(100); // Wait for 100 milliseconds before checking again
        }

        reject(new Error('Desired API response not found.'));
    });
}
main();

