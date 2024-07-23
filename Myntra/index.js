// const puppeteer = require('puppeteer');
let xlsx = require("json-as-xlsx")
const timers = require("timers");
const reader = require('xlsx')

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
// // const { Storage } = require('@google-cloud/storage');
puppeteer.use(StealthPlugin())


// const TARGET_URL = 'https://www.myntra.com/lavie?rawQuery=Lavie%3Fp%3D3&p='
// const TARGET_URL = 'https://www.myntra.com/bitterline?rawQuery=bitterline&p='
// const TARGET_URL = 'https://www.myntra.com/h-and-m?p='
const TARGET_URL = 'https://www.myntra.com/very-much-india?f=Brand%3AVery%20Much%20Indian&rawQuery=Very%20Much%20India&p='


//category mapping /////////////
let mappingData = [], categoryMap = {};
const read = reader.readFile("./myntraMappedValidation.xlsx")
read.SheetNames.forEach(sheet => {
    mappingData = reader.utils.sheet_to_json(read.Sheets[sheet])
})
for (let i = 0; i < mappingData.length; i++) {
    categoryMap[`${mappingData[i]['Myntra Category']}`] = {
        super_category : mappingData[i]['Super cateogry'],
        category : mappingData[i]['Category'],
        sub_category : mappingData[i]['Sub Category'],
        sub_sub_category : mappingData[i]['Product type'],
        sub_category_id : mappingData[i]['sub_sub_category_id'],
    }
}

async function main() {
    const browser = await puppeteer.launch({headless:"new"});
    let catalogue = [];
    // get page count
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1920, height: 1080});
    await tab.goto(TARGET_URL);
    let pagesCount = await getPagesCount(tab);
    console.log('total pages : ', pagesCount);
    // pagesCount=50;
    for (let pageIndex = 1; pageIndex <= pagesCount; pageIndex++) {
        console.log("pageIndex", pageIndex);
        let productUrls = await getProductsonPage(tab, TARGET_URL+pageIndex.toString());
        for (const productUrl of productUrls) {
        // for (const productUrl of productUrls.slice(0,1)) {
            let product_details = await parseProductPage(tab, productUrl);
            catalogue.push(product_details);
            dump(catalogue);
        
        }
    }

    //await tab.screenshot({path: 'example.png'});
    console.log(catalogue);
    dump(catalogue);
    await browser.close();
};


async function getPagesCount(page) {
    const parentElement = await page.$('.pagination-container');
    const childElements = await parentElement.$$('li');
    const count = await childElements.slice(-2)[0].evaluate(element => element.textContent);
    console.log("Count: ", count);
    return Number(count);
}

async function getProductsonPage(tab, url) {
    await tab.goto(url);
    const parentElement = await tab.$('.results-base');
    console.log("parent element", parentElement);
    if(parentElement != null){
        const productUrls = await parentElement.$$eval('[target="_blank"]', elements => elements.map(element => "https://www.myntra.com/" + element.getAttribute("href")));
        console.log('productUrls: ', productUrls);
        return productUrls;
    }
    return '';
}

async function parseProductPage(tab, url) {
    console.log('parsing ', url);
    await tab.goto(url);
    try{
    await tab.waitForSelector('.index-showMoreText');
    await tab.evaluate(() => {
        const element = document.querySelector('.index-showMoreText');
        element.click();
    });

    // Wait for some time to see the result
    await tab.waitForTimeout(500);}
    catch (err){
        console.log("element not found line no. 59");
    }
    try {
        await tab.waitForSelector('.size-buttons-unified-size');
        await tab.evaluate(() => {
            const sizeButton = document.querySelector('.size-buttons-unified-size');
            sizeButton.click();
        });
        // Wait for some time to see the result
        await tab.waitForTimeout(1000);
    } catch (err) {
        console.log("Element not found or could not be clicked lin no 70");
    }
    try {
        await tab.waitForSelector('.supplier-viewmore-link');
        await tab.evaluate(() => {
            const sizeButton = document.querySelector('.supplier-viewmore-link');
            sizeButton.click();
        });
        // Wait for some time to see the result
        await tab.waitForTimeout(1000);
    } catch (err) {
        console.log("Element not found or could not be clicked lin no 81");
    }


    const brand = await tab.$$eval('.pdp-title', elements => elements.map(element => element.textContent));
    let categoryDetails = await tab.$$eval('.breadcrumbs-container', elements => elements.map(element => element.textContent));
    if(categoryDetails == undefined || categoryDetails == "" || categoryDetails == NaN){
        categoryDetails = 'Home/Clothing/Women Clothing/Ethnic Dresses/AV2 Ethnic Dresses>More By AV2'
    } 
    
    console.log("categoryDetails --> ", categoryDetails)
    const sellerName = await tab.$$eval('.supplier-productSellerName', elements => elements.map(element => element.textContent));
    const productName = await tab.$$eval('.pdp-name', elements => elements.map(element => element.textContent));
    const price = await tab.$$eval('.pdp-price', elements => elements.map(element => element.textContent));
    const mrp = await tab.$$eval('.pdp-mrp', elements => {
        if (elements.length > 0) {
            const anchorTags = elements[0].querySelectorAll('s');
            return Array.from(anchorTags, anchorTag => anchorTag.textContent);
        } else {
            return []; // Return an empty array if the elements are not found
        }
    });
    const spec = await tab.$$eval('.index-row', elements => {
        const dataArray = [];

        for (let i = 0; i < elements.length; i++) {
            const row = elements[i];
            const keyElement = row.querySelector('.index-rowKey');
            const valueElement = row.querySelector('.index-rowValue');

            const key = keyElement.textContent;
            const value = valueElement.textContent;

            const dataObject = {};
            dataObject[key] = value;
            dataArray.push(dataObject);
        }

        return dataArray;
    });
    // console.log("line 81", spec);
    const size = await tab.$$eval('.size-buttons-unified-size', elements => elements.map(element => element.textContent));
    const fabric = await tab.$$eval('.pdp-sizeFitDescContent.pdp-product-description-content', elements => elements.map(element => element.textContent));
    const longDesc = await tab.$$eval('.pdp-product-description-content', elements => elements.map(element => element.outerHTML));
    const shortDesc = await tab.$$eval('.meta-container', elements => elements.map(element => element.outerHTML));
    // const longDesc = await tab.$$eval('.index-sizeFitDescContent.index-product-description-content', elements => elements.map(element => element.textContent));
    // console.log("line 63",longDesc)
    const discount = await tab.$$eval('.pdp-discount', elements => elements.map(element => element.textContent));
    const prodCode = await tab.$$eval('.supplier-styleId', elements => elements.map(element => element.textContent));
    const anchorTitles = await tab.$$eval('.colors-container', elements => {
        if (elements.length > 0) {
            const anchorTags = elements[0].querySelectorAll('a');
            return Array.from(anchorTags, anchorTag => anchorTag.getAttribute('title'));
        } else {
            return []; // Return an empty array if the elements are not found
        }
    });

    const images = await tab.$$eval('.image-grid-image', elements => {
        if (elements.length > 0) {
            return Array.from(elements, element => {
                const styleAttribute = element.getAttribute('style');
                const imageUrl = styleAttribute.match(/url\("([^"]+)"\)/)[1];
                return imageUrl;
            });
        } else {
            return []; // Return an empty array if the elements are not found
        }
    });
    const manufacturerDetails = await tab.$$eval('.details-details li', elements => {
        const manufacturerElement = elements.find(element => element.querySelector('h4').textContent === 'Manufacturer Details');
        if (manufacturerElement) {
            return manufacturerElement.querySelector('p').textContent;
        }
        return [];
    });
    const importerDetails = await tab.$$eval('.details-details li', elements => {
        const importerElement = elements.find(element => element.querySelector('h4').textContent === 'Importer Details');
        if (importerElement) {
            return importerElement.querySelector('p').textContent;
        }
        return [];
    });
    const packerDetails = await tab.$$eval('.details-details li', elements => {
        const packerElement = elements.find(element => element.querySelector('h4').textContent === 'Packer Details');
        if (packerElement) {
            return packerElement.querySelector('p').textContent;
        }
        return [];
    });

    console.log(productName[0])
    return {
        // 'super_category':'Women Fasion',
        'myntra_super_category': categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`] ? categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`].super_category : '',
        // 'category':'Western Wear',
        'myntra_category':categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`] ? categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`]['category'] : '',
        // 'sub_category':'Capris & Trousers & Pants',
        'myntra_sub_category': categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`] ? categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`]['sub_category'] : '',
        // 'sub_sub_category':'Capris & Trousers & Pants',
        'myntra_sub_sub_category':categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`] ? categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`]['sub_sub_category'] : '',
        'sub_category_id':categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`] ? categoryMap[`${categoryDetails[0].split('/').slice(0, -1).join('/')}`].sub_category_id : '',
        'brand': brand[0],
        'seller_name':sellerName[0],
        'product_name': productName[0],
        'price': price[0],
        'mrp': mrp[0],
        'size': size.toString(),
        'manuf_detail':manufacturerDetails,
        'packer_detail':packerDetails,
        'importer_detail':importerDetails,
        // 'fabric': fabric[1]? fabric[1].toString() : "NA",
        'fabric': fabric.flatMap(item => item.match(/[A-Z][a-z]*/))[1],
        'size&fit': fabric[0]? fabric[0].toString() : "NA",
        'variants':JSON.stringify({"size":size,"color":anchorTitles.length > 0 ? anchorTitles :[]}),
        'short_desc':shortDesc[0],
        'long_desc': longDesc[0],
        'color': anchorTitles.length > 0 ? anchorTitles.toString() : "NA",
        'images': images.length > 0 ? images.toString() : "NA",
        'discount':discount[0],
        'prod_code':prodCode[0],
        'spec':spec.length > 0 ? JSON.stringify(spec) : "NA"
    }
}

function dump(catalogue) {
    let data = [{
        sheet: "Catalogue",
        columns: [
            // {label: "super_category", value: "super_category"},
            {label: "super_category", value: "myntra_super_category"},
            // {label: "category",value: "category"},
            {label: "category",value: "myntra_category"},
            // {label: "sub_category",value: "sub_category"},
            {label: "sub_category",value: "myntra_sub_category"},
            // {label: "sub_sub_category", value: "sub_sub_category"},
            {label: "sub_sub_category", value: "myntra_sub_sub_category"},
            {label: "sub_category_id", value: "sub_category_id"},
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
            {label: "size&fit", value: "size&fit"},
            {label: "variants", value: "variants"},
            {label: "short_desc",value: "short_desc"},
            {label: "long_desc", value: "long_desc"},
            {label: "color", value: "color"},
            {label: "specification",value: "spec"},
            {label: "images", value: "images"}// Run functions
        ], content: catalogue,
    }];

    let settings = {
        fileName: "Indian", // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    }

    xlsx(data, settings);
}

main();

