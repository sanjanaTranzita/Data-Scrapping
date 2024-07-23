const puppeteer = require('puppeteer');
let xlsx = require("json-as-xlsx")
const timers = require("timers");
const { DOMParser } = require('xmldom');

const TARGET_URL = 'https://www.amazon.in/s?i=merchant-items&me=A2QWB3GSWFIBHR&page='
// const TARGET_URL = 'https://www.amazon.in/s?i=merchant-items&me=A1EWEIV3F4B24B&page='
// const TARGET_URL = 'https://www.amazon.in/s?i=merchant-items&me=A3FAUFPGLEWDFF&page='

async function main() {
    const browser = await puppeteer.launch({headless: false});
    let catalogue = [];
    // get page count
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1920, height: 1080});
    await tab.goto(TARGET_URL);
    let pagesCount = await getPagesCount(tab);
    console.log('total pages : ', pagesCount);
    for (let pageIndex = 1; pageIndex <= pagesCount; pageIndex++) {
        console.log("line no. 16", pageIndex);
        let productUrls = await getProductsonPage(tab, TARGET_URL + pageIndex.toString());
        // for (const productUrl of productUrls.slice(0, 1)) {
        for (const productUrl of productUrls) {
            let product_details = await parseProductPage(tab, productUrl);
            catalogue.push(product_details);
        }
    }

    //await tab.screenshot({path: 'example.png'});
    console.log(catalogue);
    dump(catalogue);
    await browser.close();
};


async function getPagesCount(page) {

    const parentElement = await page.$('.s-pagination-strip');
    const childElements = await parentElement.$$('a');
    const count = await childElements.slice(-2)[0].evaluate(element => element.textContent);
    console.log("line no 36",count);
    return Number(count);
}

async function getProductsonPage(tab, url) {
    await tab.goto(url);
    const parentElement = await tab.$('.rush-component.s-latency-cf-section');
    if(parentElement != null){
        const productUrls = await parentElement.$$eval('.a-size-mini.a-spacing-none.a-color-base.s-line-clamp-2 > a.a-link-normal', elements => elements.map(element => "https://www.amazon.in/"+element.getAttribute("href")));
        console.log('line no 50 productUrls: ', productUrls);
        return productUrls;
    }
    return '';
}

async function parseProductPage(tab, url) {
    console.log('parsing ', url);
    await tab.goto(url);
    // const prodCode=await (await tab.$x('//*[@id="productDetails_detailBullets_sections1"]/tbody/tr[1]/td'))[0].evaluate(el => el.textContent)
    const productName = await tab.$$eval('.a-size-large .product-title-word-break', elements => elements.map(element => element.textContent));
    const mrp = await tab.$$eval('.a-section.a-spacing-small .a-price.a-text-price .a-offscreen', elements => {
        if (elements.length > 0) {
            return Array.from(elements, element => element.textContent);
        } else {
            return []; // Return an empty array if the elements are not found
        }
    });
    const price = await tab.$$eval('.a-price.aok-align-center .a-offscreen', elements => {
        if (elements.length > 0) {
            return Array.from(elements, element => element.textContent);
        } else {
            return []; // Return an empty array if the elements are not found
        }
    });
    // const colors = await tab.$$eval('.imgSwatch', elements => elements.map(element => element.getAttribute("alt")));
    const colors = await tab.$$eval('.a-unordered-list.a-nostyle.a-button-list.a-declarative.a-button-toggle-group.a-horizontal.a-spacing-top-micro.swatches.swatchesSquare.imageSwatches li img', elements => elements.map(element => element.alt));

    let size = await tab.$$eval('.dropdownAvailable', elements => elements.map(element => element.textContent))
        if (size.length == 0){
            size=await tab.$$eval('.twisterTextDiv', elements => elements.map(element => element.querySelector('p.a-text-left.a-size-base').textContent));
        }
    console.log("size ",size);
        try{
    const discount =  await (await tab.$x('//*[@id="corePriceDisplay_desktop_feature_div"]/div[1]/span[1]'))[0].evaluate(el => el.textContent);}
    catch {
        discount=''
    }
    const shortDesc = await tab.$x('//*[@id="feature-bullets"]').then(([elementHandle]) => elementHandle?.evaluate(element => element.outerHTML));
        try{
    await tab.waitForSelector('#altImages .a-button-thumbnail img');
    const images = await tab.evaluate(() => {
        const thumbnails = Array.from(document.querySelectorAll('#altImages .a-button-thumbnail img'));
        const originalUrls = thumbnails
            .map(thumbnail => {
                let originalUrl = '';
                const thumbnailSrc = thumbnail.src;

                if (thumbnailSrc.toLowerCase().endsWith('.jpg') && !thumbnailSrc.toLowerCase().includes('play-icon')) {
                    originalUrl = thumbnailSrc.replace(/._[^.]+\.jpg$/, '.jpg');
                }

                return originalUrl;
            })
            .filter(originalUrl => originalUrl !== '');

        return originalUrls;
    });
    console.log("line no 91 ",images);}
    catch {
            images= [];
    }
    const longDesc = await tab.evaluate(() => {
        const elements = document.querySelectorAll('.aplus-v2');
        const texts = [];
        elements.forEach(element => {
            const elementText = element.innerText.trim();
            if (elementText) {
                texts.push(elementText);
            }
        });
        return texts;
    });
    // const longDesc = await tab.$x('//*[@id="aplus"]/div').then(([elementHandle]) => elementHandle?.evaluate(element => element.textContent));
    const techSpec = await tab.$$eval('#productDetails_techSpec_section_1 tr', rows => {
        const data = {};
        for (const row of rows) {
            const key = row.querySelector('th')?.textContent?.trim();
            const value = row.querySelector('td')?.textContent?.trim();
            if (key && value) {
                data[key] = value;
            }
        }
        return data;
    });
    const addSpec = await tab.$$eval('#productDetails_detailBullets_sections1 tr', rows => {
        const data = {};
        for (const row of rows) {
            const key = row.querySelector('th')?.textContent?.trim();
            const value = row.querySelector('td')?.textContent?.trim();
            if (key && value) {
                data[key] = value;
            }
        }
        return data;
    });
    const table1 = await tab.$$eval('.a-section.a-spacing-small.a-spacing-top-small table.a-normal.a-spacing-micro tr', rows => {
        const data = {};
        for (const row of rows) {
            const key = row.querySelector('td:nth-child(1) span.a-size-base.a-text-bold')?.textContent?.trim();
            const value = row.querySelector('td:nth-child(2) span.a-size-base.po-break-word')?.textContent?.trim();
            if (key && value) {
                data[key] = value;
            }
        }
        return data;
    });
    const spec=JSON.parse(JSON.stringify({...table1,...addSpec,...techSpec}));
    const specArr = Object.keys(spec).map(function(key) {
        var newObj = {};
        newObj[key] = spec[key];
        return JSON.stringify(newObj);
    });
    // console.log("line no 142",specArr);
    return {
        'super_category':'Kids & Toys',
        'category':'Toys',
        'sub_category':'Soft Toys',
        'sub_sub_category':'Stuffed Toys',
        'brand': spec['Brand']?spec['Brand']:"PepPlay",
        // 'seller_name':"PepPlay",
        'product_name': productName[0]?productName[0]:"NA",
        'price': price[0]?price[0]:"NA",
        'mrp': mrp[0]?mrp[0]:"NA",
        'size': size.toString()?size.toString():"NA",
        'manuf_detail':spec['Manufacturer']?spec['Manufacturer']:"NA",
        'packer_detail':spec['Packer']?spec['Packer']:"NA",
        'importer_detail':spec['Importer']?spec['Importer']:"NA",
        'fabric': spec['Material']?spec['Material']:"NA",
        'short_desc':shortDesc?shortDesc.toString().slice(0,32766):"",
        'long_desc': longDesc?longDesc.toString().slice(0,32767):"",
        'images': images.length > 0 ? images.toString() : "NA",
        // 'discount':/^-(?!.*₹)\d+%$/.test(discount)?discount:"NA",
        'discount':"0",
        'color':colors.length!=0?colors.toString():spec['Color']?spec['Color']:"NA",
        'prod_code':spec['ASIN']?spec['ASIN']:"NA",
        'spec':specArr.length > 0 ? "["+specArr.toString()+"]" : "[{'':''}]"
    }

}

function dump(catalogue) {
    let data = [{
        sheet: "Catalogue",
        columns: [{label: "super_category", value: "super_category"},
            {label: "category",value: "category"},
            {label: "sub_category",value: "sub_category"},
            {label: "sub_sub_category", value: "sub_sub_category"},
            {label: "brand", value: "brand"},
            {label: "seller_name",value: "seller_name"},
            {label: "prod_code",value: "prod_code"},
            {label: "product_name", value: "product_name"},
            {label: "price", value: "price"},
            {label: "mrp", value: "mrp"},
            {label:"manuf_detail",value:"manuf_detail"},
            {label:"packer_detail",value:"packer_detail"},
            {label:"importer_detail",value: "importer_detail"},
            {label:"discount",value:"discount"},
            {label: "size", value: "size"},
            {label: "fabric", value: "fabric"},
            {label: "short_desc",value: "short_desc"},
            {label: "long_desc", value: "long_desc"},
            {label: "color", value: "color"},
            {label: "specification",value: "spec"},
            {label: "images", value: "images"}// Run functions
        ], content: catalogue,
    }];

    let settings = {
        fileName: "./Amazon/AmazonDump", // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    }

    xlsx(data, settings);
}

main();