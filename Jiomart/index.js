const axios = require('axios');
const jwt = require('jsonwebtoken');
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin())
let xlsx = require("json-as-xlsx")
const TARGET_URL = 'https://www.jiomart.com/s/acclaim-enterprises/11376/products'

function findValueByKey(dataArray, desiredKey) {
    const desiredObject = dataArray.find(obj => obj.hasOwnProperty(desiredKey));
    const desiredValue = (desiredObject || {})[desiredKey] || "Not Available";
    return desiredValue;
}

async function deleteByKeys(dataArray, desiredKeys) {
    dataArray.forEach(obj => {
        desiredKeys.forEach(key => {
            delete obj[key];
        });

        if (Object.keys(obj).length === 0) {
            dataArray.splice(dataArray.indexOf(obj), 1);
        }
    });

    return dataArray;
}

async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox', '--disable-http2']
    });

    let catalogue = [];
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1920, height: 1080 });
    await tab.goto(TARGET_URL);

    let productUrls = await getProductionPage(tab, TARGET_URL);
    
    let index = 0;
    for (const productUrl of productUrls.slice(0, 2)) {  // Adjust slice as needed
        index++;
        console.log("Scraping url no. ", index);
        let product_details = await parseProductPage(tab, productUrl);
        catalogue.push(product_details);
    }

    console.log(catalogue);
    dump(catalogue);

    await browser.close();
}

async function getProductionPage(tab, url) {
    try {
        await tab.goto(url);
        console.log("timer start for scroll");
        await tab.waitForTimeout(5000);
        console.log("timer stop  for scroll");
        await smoothScroll(tab, 100, 100);
        console.log("timer start for link");
        await tab.waitForTimeout(5000);
        console.log("timer stop for link");
        const hrefArray = await tab.$$eval('.plp-card-wrapper.plp_product_list.viewed', elements => elements.map(element => 'https://www.jiomart.com' + element.getAttribute('href')));
        await tab.waitForTimeout(3000);
        console.log(hrefArray, hrefArray.length);
        return hrefArray;
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}


async function parseProductPage(tab, url) {
    console.log('parsing ', url);
    await tab.goto(url);
    const productName = await tab.$$eval('.product-header-name', elements => elements.map(element => element.textContent));
    // console.log("productName : ",productName)
    const brand = await tab.$$eval('.product-header-brand-text', elements => elements.map(element => element.textContent));
    // console.log("brand : ",brand)
    const price = await tab.$$eval('.product-price .jm-heading-xs', elements => elements.map(element => element.textContent.trim().replace('₹', '').replace(',', '')));
    // console.log("price : ", price);
    const discount = await tab.$$eval('.product-price .jm-badge', elements => elements.map(element => element.textContent.trim()));
    // console.log("discount : ", discount);
    const mrp = await tab.$$eval('.jm-body-s .line-through', elements => elements.map(element => element.textContent.trim().replace('₹', '').replace(',', '')));
    // console.log("mrp : ", mrp);
    const prod_code = await tab.$$eval('.jm-body-s-bold.jm-mr-xxs', elements => elements.map(element => element.textContent.split(":")[1].trim()));
    // console.log("prod_code : ",prod_code)
    const long_desc = await tab.$$eval('#pdp_description', elements => elements.map(element => element.outerHTML));
    // console.log("long_desc : ",long_desc)
    const color = await tab.$$eval('.product-variant-color-list-item-image', elements => elements.map(element => element.getAttribute('alt')));
    // console.log("color : ",color)
    const size = await tab.$$eval('.product-size-button-list-item .jm-btn', elements => elements.map(element => element.textContent.trim()));
    // console.log("size : ",size)
    const images = await tab.$$eval('.swiper-thumb-slides-img', elements => elements.map(element => element.getAttribute('src').replace("?im=Resize=(75,94)","").trim()));
    // console.log("images : ",images)
    let spec = {};
    try {
        // Click the button by selecting it with the data-target attribute value
        await tab.click('button[data-target="#pdp_product_information"]');
        console.log("Button clicked");
        await tab.waitForTimeout(1000)
    } catch (error) {
        console.error("Error clicking the button:", error);
    }
    await tab.waitForSelector('#pdp_product_specifications');
    // Extracting data from the table
    spec = await tab.$$eval('.product-specifications-table-item', elements => {
        const data = {};
        elements.forEach(element => {
            const keyElement = element.querySelector('.product-specifications-table-item-header');
            const valueElement = element.querySelector('.product-specifications-table-item-data');

            if (keyElement && valueElement) {
                const key = keyElement.textContent.trim();
                // const value1 = valueElement.textContent.trim();
                data[key] = valueElement.textContent.trim(); // Storing key-value pair
            }
        });
        return data;
    });
    console.log("product name :", productName[0]);
    console.log("brand name :", brand[0]);
    console.log("mrp :", mrp[0]);
    console.log("discount :", discount[0]);
    console.log("price :", price[0]);
    console.log("prod_code :", prod_code[0]);
    console.log("long desc :", long_desc);
    console.log("color :", color);
    console.log("size :", size);
    console.log("spec :", spec);
    console.log("image :", images);
    return {
        'super_category': '',
        'category': '',
        'sub_category': '',
        'sub_sub_category': '',
        'brand': brand[0] ? brand[0] : "NA",
        'product_name': productName[0] ? productName[0] : "NA",
        'price': price.length > 0 ? price[0] : "NA",
        'mrp': mrp.length > 0 ? mrp[0] : "NA",
        'size': size.length > 0 ? size.toString() : "NA",
        'manuf_detail': findValueByKey(spec.length > 0 ? spec : [{"": ""}], "Manufactured By"),
        'packer_detail': findValueByKey(spec.length > 0 ? spec : [{"": ""}], "Marketed By"),
        'importer_detail': findValueByKey(spec.length > 0 ? spec : [{"": ""}], "Imported By"),
        'fabric': '',
        'short_desc': '',
        'long_desc': long_desc ? long_desc.join('').toString().slice(0, 32767) : "",
        'images': images.length > 0 ? images.toString() : "",
        'discount': discount.length > 0 ? discount[0] : "NA",
        'color': color.length !== 0 ? color.toString() : "NA",
        'prod_code': prod_code.length > 0 ? prod_code[0] : "",
        'spec': JSON.stringify(spec),
        'variants': JSON.stringify({
            "color": color.length > 0 ? color : [],
            "size": size.length > 0 ? size : []
        })
    }

}

function dump(catalogue) {
    let data = [{
        sheet: "Catalogue",
        columns: [{label: "super_category", value: "super_category"}, {
            label: "category",
            value: "category"
        }, {label: "sub_category", value: "sub_category"}, {
            label: "sub_sub_category",
            value: "sub_sub_category"
        }, {label: "brand", value: "brand"}, {label: "prod_code", value: "prod_code"}, {
            label: "product_name",
            value: "product_name"
        }, {label: "price", value: "price"}, {label: "mrp", value: "mrp"}, {
            label: "manuf_detail",
            value: "manuf_detail"
        }, {label: "packer_detail", value: "packer_detail"}, {
            label: "importer_detail",
            value: "importer_detail"
        }, {label: "discount", value: "discount"}, {label: "size", value: "size"}, {
            label: "fabric",
            value: "fabric"
        }, {label: "short_desc", value: "short_desc"}, {label: "long_desc", value: "long_desc"}, {
            label: "color",
            value: "color"
        }, {label: "specification", value: "spec"},
            {label: "images", value: "images"}, {
            label: "variants",
            value: "variants"
        }// Run functions
        ],
        content: catalogue,
    }];

    let settings = {
        fileName: "jiomart-testing.xlsx", // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    }

    xlsx(data, settings);
}

async function smoothScroll(page, distance = 100, delay = 100) {
    await page.evaluate(
        async (distance, delay) => {
            await new Promise((resolve, reject) => {
                let lastScrollHeight = 0;
                let isScrolling = true;

                const scrollStep = () => {
                    const {scrollHeight, scrollTop, clientHeight} = document.documentElement;

                    const remainingScroll = scrollHeight - (scrollTop + clientHeight);
                    const scrollAmount = Math.min(remainingScroll, distance);

                    window.scrollBy(0, scrollAmount);

                    // Check if the scroll height has increased or if there is still room to scroll
                    if (scrollHeight > lastScrollHeight || remainingScroll > 0) {
                        lastScrollHeight = scrollHeight;
                        setTimeout(scrollStep, delay);
                    } else {
                        isScrolling = false;
                    }
                };

                scrollStep();

                // Resolve the promise once scrolling is completed
                const checkScrollingComplete = setInterval(() => {
                    if (!isScrolling) {
                        clearInterval(checkScrollingComplete);
                        resolve();
                    }
                }, 100);
            });
        },
        distance,
        delay
    );
}

main();

