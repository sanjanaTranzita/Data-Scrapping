// const timers = require("timers");
// const { DOMParser } = require('xmldom');
const puppeteer = require('puppeteer');
let xlsx = require("json-as-xlsx")
const reader = require("xlsx");
const TARGET_URL = 'https://www.limeroad.com/all?stock[]=1&src_id=searchbrand__0&position=0&f_ref=searchOnAutoCompleteBrand&brandid[]=75905'



let mappingData = [], categoryMap = {};
const read = reader.readFile("./limeRoadMappedValidation.xlsx")
read.SheetNames.forEach(sheet => {
    mappingData = reader.utils.sheet_to_json(read.Sheets[sheet])
})
for (let i = 0; i < mappingData.length; i++) {
    categoryMap[`${mappingData[i]['LimeRoad Category']}`] = {
        super_category : mappingData[i]['Super cateogry'],
        category : mappingData[i]['Category'],
        sub_category : mappingData[i]['Sub Category'],
        sub_sub_category : mappingData[i]['Product type'],
        sub_category_id : mappingData[i]['sub_sub_category_id'],
    }
}
async function getValueByKey(array, key) {
    for (const obj of array) {
        if (obj.hasOwnProperty(key)) {
            return obj[key];
        }
    }
    return null; // Return null or a default value if the key is not found
}

function getNumber(inputString) {
    const regex = /(\d+)/;

    const match = inputString.match(regex);
    if (match) {
        const num = parseInt(match[0]);
        console.log(num);
        return num
    }
    return 0
}

function deleteObjectsByKeys(arrayOfObjects, keysToDelete) {
    return arrayOfObjects.filter(item => {
        const key = Object.keys(item)[0];
        return !keysToDelete.includes(key);
    });
}

async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    //  const browser = await puppeteer.connect({ browserWSEndpoint: 'ws://localhost:9222/devtools/browser' });

    let catalogue = [];
    // get page count
    const tab = await browser.newPage();
    await tab.setViewport({width: 1920, height: 1080});
    await tab.goto(TARGET_URL);
    let productUrls = await getProductsonPage(tab, TARGET_URL);
    // for (const productUrl of productUrls.slice(0, 10)) {
        for (const productUrl of productUrls) {
        // console.log(productUrl);
        let product_details = await parseProductPage(tab, productUrl);
        catalogue.push(product_details);
    }

    console.log(catalogue);
    dump(catalogue);
    await browser.close();
}

async function getProductsonPage(tab, url) {
    await tab.waitForTimeout(5000);
    const prodCount = getNumber(await tab.$eval('.dTr .dTc', (element) => element.textContent));
    console.log("prodCount =>>", prodCount);

    try {
        await tab.waitForTimeout(5000);
        const elementXPath = '//*[@id="breadcrumbs"]';
        await tab.waitForXPath(elementXPath);
        // const elementHandle = await tab.$x(elementXPath);

        // const hrefValues = await tab.$$eval('a.phref', (elements) => {
        //     return elements.map((element) => "https://www.limeroad.com/" + element.getAttribute('href'));
        // });
        //
        // console.log('href: ', hrefValues, hrefValues.length);
        // return hrefValues
        // Click on the element
        // await elementHandle[0].click();
        // Continuously press the down arrow key until the specified duration is reached
        let scrolling = true;
        while (scrolling) {
            await tab.keyboard.press('ArrowDown');
            // Adjust the delay as needed to control the scrolling speed
            await tab.waitForTimeout(40);
            let EOP = await tab.$$eval('.fs14.c6.taC.mt48', (elements) => {
                return elements.map((element) => element.textContent.trim());
            });
            if (EOP.length > 0) {
                scrolling = false;
            }
            console.log("EOP in loop ===========>", EOP);// 100 milliseconds
        }
const hrefValues = await tab.$$eval('a.phref', (elements) => {
    return elements.map((element) => "https://www.limeroad.com/"+element.getAttribute('href'));
  });

  console.log('href: ', hrefValues,hrefValues.length);
  return  hrefValues
    } catch (error) {
        console.error('An error occurred:', error);
        return [];
    }
}


async function parseProductPage(tab, url) {
    console.log('parsing ', url);
    await tab.goto(url);
    let limeRoad_category = (await tab.$$eval('.c6.fs12.wsN.m0.p2.bgE.taL.p012', elements => elements.map(element => element.textContent.trim())))[0].replace(/[\n\s]+/g, ' ').trim().toLowerCase().split("»").slice(0, -1).join("»").trim();
    let productName = await tab.$$eval('.ftwN.m0.p0.c3.fs20.pt0.p12.pb2.bs.ttC', (elements) => {
        return elements.map((element) => element.textContent.trim());
    });
    const brand = await tab.$$eval('.dTc.vM.wp100', (elements) => {
        return elements.map((element) => element.textContent.trim());
    });
    const mrp = await tab.$$eval('.mrp', elements => elements.map(element => element.textContent.trim()));
    const discount = await tab.$$eval('.off', elements => elements.map(element => element.textContent.trim()));
    const price = await tab.$$eval('.sell', elements => elements.map(element => element.textContent.trim()));
    const prod_code = await tab.$$eval('.p80.pt0.wp100 .dIb.vT.c6', elements => elements.map(element => element.textContent.trim()));
    const long_desc = await tab.$$eval('.c9.lh20.pl12', elements => elements.map(element => element.outerHTML));
    const size = await tab.$$eval('.br10.bd3.p410.hcP.hbxs.bxs.bs.size', elements => elements.map(element => element.textContent.trim()));
    const images = await tab.$$eval('.br4.dB.l0.pA.t0', elements => elements.map(element => "https:" + element.getAttribute('src')));
    const spec = await tab.$$eval('.p80.pt0.wp100', (elements) => {
        return elements.map((element) => {
            const keyElement = element.querySelector('.dIb.vT');
            const valueElement = element.querySelector('.dIb.vT.c3');

            if (keyElement && valueElement) {
                const key = keyElement.textContent.trim();
                const value = valueElement.textContent.trim();
                return {[key.replace(":", "").trim()]: value};
            }

            return null;
        }).filter(Boolean);
    });
    // try {
    // Wait for the element to appear in the DOM
//     await tab.waitForSelector('.bgD.br4.c6.dIb.fs13.fwB.p4.ttU');
//
//     // Click on the element
//     await tab.click('.bgD.br4.c6.dIb.fs13.fwB.p4.ttU');
//
//     console.log('seller button clicked successfully.');
//     await tab.waitForTimeout(2000);
//   } catch (error) {
//     console.error('Error clicking seller button:', error);
//   }
//   await tab.waitForXPath("//*[@id=\"captchaThingy\"]");
//     const CAPTCHA = await tab.$x("//*[@id=\"captchaThingy\"]");
//   await CAPTCHA[0].click();
// await tab.waitForTimeout(5000);
    // images = images.filter(url => !url.includes('473Wx593H'));
    console.log("product name :", productName[0]);
    console.log("brand name :", brand[0].replace('brand', "").trim());
    console.log("mrp :", mrp[0]);
    console.log("discount :", discount[0]);
    console.log("price :", price[0]);
    console.log("prod_code :", prod_code[0]);
    console.log("long desc :", long_desc);
    console.log("color :", await getValueByKey(spec, 'color'));
    console.log("size :", size);
    console.log("spec :", deleteObjectsByKeys(spec, ["product description"]));
    console.log("image :", images);
    console.log("limeRoad_category :", limeRoad_category);

    return {
        'limeRoad_category': limeRoad_category,
        'super_category': categoryMap[`${limeRoad_category}`] ? categoryMap[`${limeRoad_category}`]["super_category"] : '',
        'category': categoryMap[`${limeRoad_category}`] ? categoryMap[`${limeRoad_category}`]["category"] : '',
        'sub_category': categoryMap[`${limeRoad_category}`] ? categoryMap[`${limeRoad_category}`]["sub_category"] : '',
        'sub_sub_category': categoryMap[`${limeRoad_category}`] ? categoryMap[`${limeRoad_category}`]["sub_sub_category"] : '',
        'sub_category_id':categoryMap[`${limeRoad_category}`] ? categoryMap[`${limeRoad_category}`]["sub_category_id"] : '',
        'brand': brand[0] ? brand[0].replace('brand', "").trim() : "NA",
        'product_name': productName[0] ? productName[0] : "NA",
        'price': price.length > 0 ? price[0] : "NA",
        'mrp': mrp.length > 0 ? mrp[0] : "NA",
        'size': size.length > 0 ? size.toString() : "NA",
        // 'manuf_detail': findValueByKey(spec.length > 0 ? spec : [{"": ""}], "Manufactured By"),
        // 'packer_detail': findValueByKey(spec.length > 0 ? spec : [{"": ""}], "Marketed By"),
        // 'importer_detail': findValueByKey(spec.length > 0 ? spec : [{"": ""}], "Imported By"),
        'short_desc': await getValueByKey(spec, 'product description') ? await getValueByKey(spec, 'product description') : " ",
        'long_desc': long_desc ? long_desc.join('').toString().slice(0, 32767) : "",
        'images': images.length > 0 ? JSON.stringify(images) : [],
        'discount': discount.length > 0 ? discount[0] : "NA",
        'color': await getValueByKey(spec, 'color') ? await getValueByKey(spec, 'color') : [],
        'prod_code': prod_code.length > 0 ? prod_code[0] : "NA",
        'spec': spec.length > 0 ? JSON.stringify(deleteObjectsByKeys(spec, ["product description","color","size"])) : "[]",
        'variants': JSON.stringify({
            "color": [await getValueByKey(spec, 'color')].length > 0 ? [await getValueByKey(spec, 'color')] : [],
            "size": size.length > 0 ? size : []
        })
    }

}

function dump(catalogue) {
    let data = [{
        sheet: "Catalogue",
        columns: [{label: "limeRoad_category", value: "limeRoad_category"}
            , {label: "super_category", value: "super_category"}, {
                label: "category",
                value: "category"
            }, {label: "sub_category", value: "sub_category"}, {
                label: "sub_sub_category",
                value: "sub_sub_category"
            }, {label: "sub_category_id", value: "sub_category_id"}, {
                label: "brand",
                value: "brand"
            },{label: "seller_name", value: "seller_name"}, {label: "prod_code", value: "prod_code"}, {
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
            }, {label: "specification", value: "spec"}, {label: "images", value: "images"}, {
                label: "variants",
                value: "variants"
            }// Run functions
        ],
        content: catalogue,
    }];

    let settings = {
        fileName: "./testingDump", // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    }

    xlsx(data, settings);
}


main();

