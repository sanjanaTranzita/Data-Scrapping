// const puppeteer = require('puppeteer');
let xlsx = require("json-as-xlsx")
const timers = require("timers");
const reader = require('xlsx')

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { writeFileSync } = require("node:fs");
puppeteer.use(StealthPlugin())

// const TARGET_URL = 'https://www.amazon.in/s?k=adro&i=apparel&rh=n%3A1571271031%2Cp_89%3AADRO&dc&page='
// const TARGET_URL = 'https://www.amazon.in/s?i=merchant-items&me=A1EWEIV3F4B24B&page='
// const TARGET_URL = 'https://www.amazon.in/s?i=merchant-items&me=A3FAUFPGLEWDFF&page='
const TARGET_URL = 'https://www.amazon.in/s?k=Nityanand+Creations&page='

//category mapping 
let mappingData = [], categoryMap = {};
const read = reader.readFile("Amazon-catalog-mapping.xlsx")
read.SheetNames.forEach(sheet => {
    mappingData = reader.utils.sheet_to_json(read.Sheets[sheet])
})
for (let i = 0; i < mappingData.length; i++) {
    categoryMap[`${mappingData[i]['Amazon Category']}`] = {
        super_category: mappingData[i]['Super cateogry'],
        category: mappingData[i]['Category'],
        sub_category: mappingData[i]['Sub Category'],
        sub_sub_category: mappingData[i]['Sub Category'],
        sub_sub_category_id: mappingData[i]['sub_sub_category_id'],
    }
}
function addCatalogue(){
    worksheet.addRows(dataToAppend);
}

console.log("category map:", categoryMap)

async function main() {
    // const browser = await puppeteer.launch({headless: "new"});
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized', '--no-sandbox'] });
    let catalogue = [];

    // get page count
    const tab = await browser.newPage();
    await tab.setViewport({ width: 1920, height: 1080 });
    await tab.goto(TARGET_URL);
    let pagesCount = await getPagesCount(tab);
    console.log('total pages : ', pagesCount);
    pagesCount = 1
    for (let pageIndex = 1; pageIndex <= pagesCount; pageIndex++) {
        console.log("line no. 16", pageIndex);
        let productUrls = await getProductsonPage(tab, TARGET_URL + pageIndex.toString());

        // for (const productUrl of productUrls.slice(0, 1)) {
        let index = 0
        for (const productUrl of productUrls) {
            let product_details = await parseProductPage(tab, productUrl);
            index++;
            console.log("Scraping url no. ", index);
            catalogue.push(product_details);
            dump(catalogue);
        }
        break
    }
    ``
    //await tab.screenshot({path: 'example.png'});
    console.log(catalogue);

    await browser.close();
};


async function getPagesCount(page) {

    const parentElement = await page.$('.s-pagination-strip');
    const childElements = await parentElement.$$('a');
    const count = await childElements.slice(-2)[0].evaluate(element => element.textContent);
    console.log("line no 36", count);
    return Number(count);
}

async function getProductsonPage(tab, url) {
    await tab.goto(url);
    const parentElement = await tab.$('.rush-component.s-latency-cf-section');
    if (parentElement != null) {
        const productUrls = await tab.evaluate(() => {
            const sponsoredLabelXPath = "//span[contains(@class, 's-sponsored-label-text')]";
            const sponsoredLabels = document.evaluate(sponsoredLabelXPath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            const sponsoredElements = new Set();
            for (let i = 0; i < sponsoredLabels.snapshotLength; i++) {
                const label = sponsoredLabels.snapshotItem(i);
                sponsoredElements.add(label.closest('div'));
            }
            const productLinks = Array.from(document.querySelectorAll('[target="_blank"]'));
            const nonSponsoredUrls = [];


            for (const link of productLinks) {
                const closestSpan = link.closest('span');
                if (sponsoredElements.has(closestSpan)) {
                    console.log('Sponsored product found, skipping:', link.href);
                    continue; 
                }
                nonSponsoredUrls.push("https://www.amazon.in" + link.getAttribute('href'));
            }

            return nonSponsoredUrls;
        });

        console.log('line no 50 productUrls: ', productUrls);

        return productUrls;
    }
    console.log("parentElement is null");
    return [];
}



async function parseProductPage(tab, url) {
    console.log('parsing ', url);
    await tab.goto(url);
    let spec =[]
    // const prodCode=await (await tab.$x('//*[@id="productDetails_detailBullets_sections1"]/tbody/tr[1]/td'))[0].evaluate(el => el.textContent)
    const productName = await tab.$$eval('.a-size-large .product-title-word-break', elements => elements.map(element => element.textContent));
    console.log("productName -->", productName)
    let brand;
    let brandItem;
    try {
        await tab.waitForXPath('//*[@id="bylineInfo"]');
        const [element2] = await tab.$x('//*[@id="bylineInfo"]');
        brandItem = await tab.evaluate(el => el.textContent, element2);
        brand = brandItem ? brandItem.trim().replace(/^Brand:\s*/, '') : 'NA';
        console.log("brand -> ", brand)
    }
    catch (err) {
        console.log("brand error ", err)
    }

    await tab.waitForSelector('ul.a-unordered-list');
    let categoryPath = await tab.evaluate(() => {
        const pathElements = Array.from(document.querySelectorAll('.a-link-normal.a-color-tertiary'));
        return pathElements.map(element => element.textContent.trim()).join('›');
    });
    console.log("categoryPath --> ", categoryPath);

    const mrp = await tab.$$eval('.a-section.a-spacing-small .a-price.a-text-price .a-offscreen', elements => {
        if (elements.length > 0) {
            let mrpArr = Array.from(elements, element => element.textContent);
            let filteredMrpArray = mrpArr.filter(str => str.trim() !== "");
            console.log("MRP:", mrpArr);
            return filteredMrpArray;
        } else {
            return [];
        }
    });
    const price = await tab.$$eval('.a-price.aok-align-center .a-offscreen', elements => {
        if (elements.length > 0) {
            let priceArr = Array.from(elements, element => element.textContent);
            let filteredPriceArray = priceArr.filter(str => str.trim() !== "");
            console.log("Price:");
            return filteredPriceArray;
        } else {
            return []; // Return an empty array if the elements are not found
        }
    });

    // const colors = await tab.$$eval('.a-unordered-list.a-nostyle.a-button-list.a-declarative.a-button-toggle-group.a-horizontal.a-spacing-top-micro.swatches.swatchesSquare.imageSwatches li img', elements => elements.map(element => element.alt));

    // const colors = await tab.evaluate(() => {
    //     const colorElements = Array.from(document.querySelectorAll('.imgSwatch'));
    //     return colorElements.map(colorElement => colorElement.alt);
    // });
    let colors =[];
    try {
        colors = await tab.evaluate(() => {
            const colorElements = Array.from(document.querySelectorAll('.imgSwatch'));
            return colorElements.map((colorElement, index) => ({
                alt: colorElement.alt,
                index: index
            }));
        });
        
        console.log("Colors:", colors);
    } catch (error) {
        console.error("An error occurred while evaluating the colors:", error);
    }
    
    //    variation with image ---complete 
    let variation_map = {}
    // Iterate over the colors array and click on each element
    for (let color of colors) {
        await tab.evaluate(index => {
            document.querySelectorAll('.imgSwatch')[index].click();
        }, color.index);

        // Optionally, you can add a delay between clicks if needed
        await tab.waitForTimeout(3000); // 1 second delay
        variation_map[color.alt] = await tab.evaluate(() => {
            const thumbnails = Array.from(document.querySelectorAll('#altImages .a-button-thumbnail img'));
            return thumbnails.map(thumbnail => {
                let originalUrl = '';
                const thumbnailSrc = thumbnail.src;

                if (thumbnailSrc.toLowerCase().endsWith('.jpg') && !thumbnailSrc.toLowerCase().includes('play-icon')) {
                    originalUrl = thumbnailSrc.replace(/._[^.]+\.jpg$/, '.jpg');
                }

                return originalUrl;
            })
                .filter(originalUrl => originalUrl !== '');
        })
    }

    if (Object.keys(variation_map).length === 0) {
        console.log("checkpoint-1")
        const dropdownSelector = '#native_dropdown_selected_color_name';

        // Get all the option elements within the dropdown
        const options = await tab.$$(`${dropdownSelector} option`);

        for (let i = 0; i < options.length; i++) {
            const optionValue = await (await options[i].getProperty('value')).jsonValue();
            const optionText = (await (await options[i].getProperty('textContent')).jsonValue()).trim();

            // Click the dropdown to open it
            await tab.click(dropdownSelector);

            // Click the option
            await tab.select(dropdownSelector, optionValue);

            console.log(`Clicked on: ${optionText}`);

            // Optionally, you can add some delay to see the clicking process
            await tab.waitForTimeout(500);
            let tempImage = await tab.evaluate(() => {
                const thumbnails = Array.from(document.querySelectorAll('#altImages .a-button-thumbnail img'));
                return thumbnails.map(thumbnail => {
                    let originalUrl = '';
                    const thumbnailSrc = thumbnail.src;

                    if (thumbnailSrc.toLowerCase().endsWith('.jpg') && !thumbnailSrc.toLowerCase().includes('play-icon')) {
                        originalUrl = thumbnailSrc.replace(/._[^.]+\.jpg$/, '.jpg');
                    }

                    return originalUrl;
                })
                    .filter(originalUrl => originalUrl !== '');
            })
            variation_map[optionText] = tempImage

        }
    }
    console.log("variation_map --> ", variation_map)

    // ========================================================================= getting size ---working=======================================================
    let size= [];
    try {
        size = await tab.evaluate(() => {
            const dropdown = document.querySelector('#native_dropdown_selected_size_name');
            if (!dropdown) {
                return [];
            }
            const optionsArray = Array.from(dropdown.options).slice(1);
            return optionsArray.map(option => option.textContent.trim());
        });
        console.log("size-->", size);
    } catch (err) {
        console.error('Error:', err);
    }

    // ===================================================================================================================================================
    let discount = await tab.waitForXPath('//*[@id="corePriceDisplay_desktop_feature_div"]/div[1]/span[2]', { timeout: 5000 });
    const [discountElement] = await tab.$x('//*[@id="corePriceDisplay_desktop_feature_div"]/div[1]/span[2]');

    if (discountElement) {
        discount = await tab.evaluate(el => el.textContent.trim(), discountElement);
    } else {
        console.log('Discount element not found.');
    }
    console.log('Discount:', discount);


    // const shortDesc = await tab.$x('//*[@id="feature-bullets"]').then(([elementHandle]) => elementHandle?.evaluate(element => element.outerHTML));


    //========================================================================short description ================================================================
    const shortDesc = await tab.evaluate(() => {
        const spans = document.querySelectorAll('.a-list-item.a-size-base.a-color-base');
        let text = '';
        spans.forEach(span => {
            text += span.textContent.trim() + '\n';
        });
        return text;
    });

    console.log("shortDesc --> ", shortDesc);
    // Long Description Details ---------

    let longDesc;

    try {
        longDesc = await tab.evaluate(() => {
            const div = document.querySelector('#productDescription');
            if (!div) {
                return ''; // Return an empty string if the div is not found
            }
            div.querySelectorAll('*').forEach(node => {
                if (node.nodeType === Node.COMMENT_NODE) {
                    node.remove();
                }
            });
            return div.textContent.trim();
        });

        console.log("LongDesc --->", longDesc);
    } catch (err) {
        console.error('Error:', err);
    }

    let ref = tab.url()
    // =======================================================================================================================================================
    let images = [];
    try {
        await tab.waitForSelector('#altImages .a-button-thumbnail img');
        images = await tab.evaluate(() => {
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
        console.log("Url of images--> ", images);
    }
    catch {
        images = [];
    }
    // const longDesc = await tab.evaluate(() => {
    //     const elements = document.querySelectorAll('.aplus-v2');
    //     const texts = [];
    //     elements.forEach(element => {
    //         const elementText = element.innerText.trim();
    //         if (elementText) {
    //             texts.push(elementText);
    //         }
    //     });
    //     return texts;
    // });


    const productDetails = await tab.evaluate(() => {
        const productDetailsDivs = document.querySelectorAll('.product-facts-detail');
    
        const detailsArray = [];
    
        productDetailsDivs.forEach((div) => {
            const keyElement = div.querySelector('.a-col-left .a-color-base');
            const valueElement = div.querySelector('.a-col-right .a-color-base');
    
            if (keyElement && valueElement) {
                const key = keyElement.textContent.trim();
                const value = valueElement.textContent.trim();
    
                detailsArray.push({ [key]: value });
            }
        });
    
        return JSON.stringify(detailsArray);
    });
    
    const parsedDetails = JSON.parse(productDetails);
    
    let manufactureDetails = 'NA';
    let packerDetails = 'NA';
    
    parsedDetails.forEach(detail => {
        if (detail.Manufacturer) {
            manufactureDetails = detail.Manufacturer;
        }
        if (detail.Packer) {
            packerDetails = detail.Packer;
        }
    });
    console.log("Manufacture Details -->",manufactureDetails);
    console.log("Packer Details -->",packerDetails);
    console.log("Product Details-->",productDetails);
    //  for Adro #detailBullets_feature_div > ul > li:nth-child(4) > span > span:nth-child(2)
    let asin = await tab.$$eval('#detailBullets_feature_div > ul > li:nth-child(4) > span > span:nth-child(2)', elements => elements.map(element => element.textContent));

    // let asin = await tab.$$eval('#detailBullets_feature_div > ul > li:nth-child(3) > span > span:nth-child(2)', elements => elements.map(element => element.textContent));
    asin = asin[0]

    // const longDesc = await tab.$x('//*[@id="aplus"]/div').then(([elementHandle]) => elementHandle?.evaluate(element => element.textContent));
    // const techSpec = await tab.$$eval('#productDetails_techSpec_section_1 tr', rows => {
    //     const data = {};
    //     for (const row of rows) {
    //         const key = row.querySelector('th')?.textContent?.trim();
    //         const value = row.querySelector('td')?.textContent?.trim();
    //         if (key && value) {
    //             data[key] = value;
    //         }
    //     }
    //     return data;
    // });
    // const addSpec = await tab.$$eval('#productDetails_detailBullets_sections1 tr', rows => {
    //     const data = {};
    //     for (const row of rows) {
    //         const key = row.querySelector('th')?.textContent?.trim();
    //         const value = row.querySelector('td')?.textContent?.trim();
    //         if (key && value) {
    //             data[key] = value;
    //         }
    //     }
    //     return data;
    // });
    // const table1 = await tab.$$eval('.a-section.a-spacing-small.a-spacing-top-small table.a-normal.a-spacing-micro tr', rows => {
    //     const data = {};
    //     for (const row of rows) {
    //         const key = row.querySelector('td:nth-child(1) span.a-size-base.a-text-bold')?.textContent?.trim();
    //         const value = row.querySelector('td:nth-child(2) span.a-size-base.po-break-word')?.textContent?.trim();
    //         if (key && value) {
    //             data[key] = value;
    //         }
    //     }
    //     return data;
    // });

    // const spec=JSON.parse(JSON.stringify({...productDetails}));
    // const specArr = Object.keys(spec).map(function(key) {
    //     var newObj = {};
    //     newObj[key] = spec[key];
    //     return JSON.stringify(newObj);
    // });
    // console.log("line no 142",specArr);
    const specArr = JSON.stringify(productDetails)
    return {
        'amazon_category': categoryPath ? categoryPath.trim() : "NA",
        'super_category': categoryMap[`${categoryPath}`.trim()] ? categoryMap[`${categoryPath}`].super_category : 'NA',
        'category': categoryMap[`${categoryPath}`] ? categoryMap[`${categoryPath}`]['category'] : 'NA',
        'sub_category': categoryMap[`${categoryPath}`] ? categoryMap[`${categoryPath}`]['sub_category'] : 'NA',
        'sub_sub_category': categoryMap[`${categoryPath}`] ? categoryMap[`${categoryPath}`]['sub_sub_category'] : 'NA',
        'sub_sub_category_id': categoryMap[`${categoryPath}`] ? categoryMap[`${categoryPath}`].sub_sub_category_id : 'NA',
        // 'brand': brand?brand.trim():"NA",
        brand: brandItem ? brandItem.trim().replace(/^Brand:\s*/, '') : 'NA',
        // 'seller_name':"PepPlay",
        'product_name': productName[0] ? productName[0].trim() : "NA",
        'price': price[0] ? price[0].trim() : "NA",
        'mrp': mrp[0] ? mrp[0].trim() : "NA",
        'size': size ? (Array.isArray(size) ? size.map(s => s.trim()) : [size.trim()]) : [],
        'manuf_detail': manufactureDetails ? manufactureDetails : "Self",
        'packer_detail': packerDetails ? packerDetails : "Self",
        // 'importer_detail': specArr['Importer'] ? specArr['Importer'] : "NA",
        'fabric': specArr['Material'] ? specArr['Material'].trim() : "NA",
        'short_desc': shortDesc ? shortDesc.toString().slice(0, 32766).trim() : "[]",
        'long_desc': longDesc ? longDesc.toString().slice(0, 32767).trim() : "[]",
        'images': images.length > 0 ? images.toString().trim() : "NA",
        // 'images' :images,
        'discount':/^-(?!.*₹)\d+%$/.test(discount)?discount: "NA",
        // 'discount': "0",
        'color': Object.keys(variation_map).length > 0 ? Object.keys(variation_map) : [],
        'prod_code': asin ? asin.trim() : "NA",
        'spec': specArr.length > 0 ? specArr.trim() : "[{'':''}]",
        "variation_map": JSON.stringify(variation_map).trim(),
        'ref': ref.trim()
    }

}

function dump(catalogue) {

    const NewData = JSON.stringify(catalogue, null, 4);

    // Write new data to accounts.json
    writeFileSync('Adro-testing.json', NewData);
    // let data = [{
    //     sheet: "Catalogue",
    //     columns: [
    //         {label: "amazon_category", value: "amazon_category"},
    //         {label: "super_category", value: "super_category"},
    //         {label: "category",value: "category"},
    //         {label: "sub_category",value: "sub_category"},
    //         {label: "sub_sub_category", value: "sub_sub_category"},
    //         {label: "sub_sub_category_id", value: "sub_sub_category_id"},
    //         {label: "brand", value: "brand"},
    //         {label: "seller_name",value: "seller_name"},
    //         {label: "prod_code",value: "prod_code"},
    //         {label: "product_name", value: "product_name"},
    //         {label: "price", value: "price"},
    //         {label: "mrp", value: "mrp"},
    //         {label:"manuf_detail",value:"manuf_detail"},
    //         {label:"packer_detail",value:"packer_detail"},
    //         {label:"importer_detail",value: "importer_detail"},
    //         {label:"discount",value:"discount"},
    //         {label: "size", value: "size"},
    //         {label: "fabric", value: "fabric"},
    //         {label: "short_desc",value: "short_desc"},
    //         {label: "long_desc", value: "long_desc"},
    //         {label: "color", value: "color"},
    //         {label: "specification",value: "spec"},
    //         {label: "images", value: "images"},// Run functions
    //         {label: "ref", value: "ref"},
    //         {label: "variation_map", value: "variation_map"}
    //
    //     ], content: catalogue,
    // }];
    //
    // let settings = {
    //     fileName: "Adro-testing", // Name of the resulting spreadsheet
    //     extraLength: 3, // A bigger number means that columns will be wider
    //     writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
    //     writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    // }
    //
    // xlsx(data, settings);
}

main();
