// const timers = require("timers");
// const { DOMParser } = require('xmldom');
const puppeteer=require('puppeteer');
const reader = require('xlsx');
let xlsx = require("json-as-xlsx")
// const TARGET_URL = 'https://www.flipkart.com/search?q=Fargo&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off...FARGO&page='
// const TARGET_URL = 'https://www.flipkart.com/dress-materials/icchit-fal~brand/pr?sid=clo%2Cqfi%2Cxcx%2Cms4&marketplace=FLIPKART&otracker=product_breadCrumbs_ICCHIT+FAL+Women%27s+Dress+Materials&page='
// const TARGET_URL = 'https://www.flipkart.com/womens-dresses/purvaja~brand/pr?sid=clo,odx,maj,jhy&marketplace=FLIPKART&otracker=product_breadCrumbs_PURVAJA+Women%27s+Dresses'

// const TARGET_URL = 'https://www.flipkart.com/womens-kurtas-kurtis/madhurima-collection~brand/pr?sid=clo%2Ccfv%2Ccib%2Crkt&marketplace=FLIPKART&otracker=product_breadCrumbs_Madhurima+Collection+Women%27s+Kurtas&page='
// const TARGET_URL = 'https://www.flipkart.com/search?q=anjaneya+sarees&as=on&as-show=on&otracker=AS_Query_OrganicAutoSuggest_1_15_na_na_na&otracker1=AS_Query_OrganicAutoSuggest_1_15_na_na_na&as-pos=1&as-type=RECENT&suggestionId=anjaneya+sarees&requestId=7c3e1dcb-88bc-40c1-9676-74625faba8a6&as-searchtext=anjaneya+sarees&p%5B%5D=facets.brand%255B%255D%3DAnjaneya%2BSarees&p%5B%5D=facets.ideal_for%255B%255D%3DWomen&page='
// const TARGET_URL = 'https://www.flipkart.com/search?q=overlap&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off&page='
// const TARGET_URL = 'https://www.flipkart.com/mens-tshirts/trenfort~brand/pr?sid=clo,ash,ank,edy&marketplace=FLIPKART&otracker=product_breadCrumbs_Trenfort+Men%27s+T-shirts'
// const TARGET_URL ='https://www.flipkart.com/search?q=Americanchoice&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off'
// const TARGET_URL ='https://www.flipkart.com/search?q=toxic%20addiction%20track%20sute&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off&page='
// const TARGET_URL ='https://www.flipkart.com/search?q=Franklord&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off&page='
// const TARGET_URL = 'https://www.flipkart.com/clothing-and-accessories/pr?sid=clo&q=AK+Enterprises&otracker=categorytree&p%5B%5D=facets.brand%255B%255D%3DA%2BK%2BEnterprises'
// const TARGET_URL = 'https://www.flipkart.com/bags-wallets-belts/handbags-clutches/desireshop~brand/pr?sid=reh,ihu&marketplace=FLIPKART&otracker=product_breadCrumbs_Desireshop+Handbags+%26+Clutches'
// const TARGET_URL = 'https://www.flipkart.com/kids-accessories/school-supplies/school-bags/smartgallery~brand/pr?sid=d69,thr,wsp&marketplace=FLIPKART&otracker=product_breadCrumbs_Smartgallery+School+Bags?page='
const TARGET_URL = 'https://www.flipkart.com/clothing-and-accessories/dresses-and-gowns/dresses/kids-dresses/fassy~brand/pr?sid=clo,odx,maj,zc1&marketplace=FLIPKART&otracker=product_breadCrumbs_FASSY+Kids%27+Dresses'

//category mapping //
let mappingData = [], categoryMap = {};
const read = reader.readFile("./flipkartMappedValidation.xlsx")
read.SheetNames.forEach(sheet => {
    mappingData = reader.utils.sheet_to_json(read.Sheets[sheet])
})
for (let i = 0; i < mappingData.length; i++) {
    categoryMap[`${mappingData[i]['Flipkart Category']}`] = {
        super_category : mappingData[i]['Super cateogry'],
        category : mappingData[i]['Category'],
        sub_category : mappingData[i]['Sub Category'],
        sub_sub_category : mappingData[i]['Product type'],
        sub_category_id : mappingData[i]['sub_sub_category_id'],
    }
}

function searchValueByKeyInSpec(array, key) {
    for (const obj of array) {
        if (obj.hasOwnProperty(key)) {
            return obj[key][0]; // Assuming each value is an array with a single element
        }
    }
    return "NA"; // Key not found
}

function addCatalogue(){
    worksheet.addRows(dataToAppend);
}

async function main() {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized',"--no-sandbox","--disable-http2"]
    });
    let catalogue = [];
    
    // get page count
    const tab = await browser.newPage();
    await tab.setViewport({width: 1920, height: 1080});
    await tab.goto(TARGET_URL);
    let pagesCount = await getPagesCount(tab);
    console.log("Pagecount in main function: ",pagesCount);
    for (let pageIndex = 1; pageIndex <= pagesCount; pageIndex++) {
        console.log("line no. 58", pageIndex);
        let productUrls = await getProductionPage(tab, TARGET_URL + pageIndex.toString());
        console.log(`product urls in main page \n url count after removing sponsered urls : ${productUrls.length}.`)
        // for (const productUrl of productUrls.slice(0, 1)) {
        let index =0
            for (const productUrl of productUrls) {
            let product_details = await parseProductPage(tab, productUrl);
            index ++ ;
            console.log("Scraping url no. ",index);
            // let product_details = await parseProductPage(tab, "https://www.flipkart.com/kajaru-printed-men-round-neck-light-blue-green-t-shirt/p/itmf385791fedd56?pid=TSHGHEGN84FWX7F7&lid=LSTTSHGHEGN84FWX7F7QSQ3HE&marketplace=FLIPKART&store=clo%2Fash%2Fank%2Fedy&srno=b_1_18&otracker=product_breadCrumbs_Trenfort%20Men");

            // let product_details = await parseProductPage(tab, "https://www.flipkart.com/wahoo-girls-casual-rayon-overlap-top/p/itm3f774694e0316?pid=KTOHFC7Z8HNCZTU4&lid=LSTKTOHFC7Z8HNCZTU4FBOFGS&marketplace=FLIPKART&q=overlap&sattr[]=color&st=color&otracker=search");
            
            catalogue.push(product_details);
            // break
        }
            break
    }

    //await tab.screenshot({path: 'example.png'});
    dump(catalogue);
    await browser.close(); 
}


async function getPagesCount(page) {
    try {
        const spanData = await page.$eval('._1G0WLw span', el => el.textContent);
        if (spanData) {
            let spanDataArr = spanData.split("of")
            if (spanDataArr.length > 1) {
                console.log("spanDataArr length greater than 1 ");
                return Number(spanDataArr[1].trim())
            }
            console.log("spanDataArr length less than 1 ");
            return 1
        }
        console.log("spanData : ", spanData);
        return 1
    }catch (e) {
        console.log("error getting during page count: ",e);
        return 1
    }
}

async function getProductionPage(tab, url) {
    console.log("going to ",url);
    await tab.goto(url);
    const xpath = '//*[@id="container"]/div/div[3]/div[1]/div[2]';
    const items = await tab.$x(xpath);
    try{
    const elements = await items[0].$$('div[data-id]');
    console.log("element-length : ",elements.length);
    const productUrls = [];
    for (const div of elements) {

        // let checksponsered = await  div.$$eval(".xgS27m", (elements1) =>{
        //     return elements1
        // })
        // if(checksponsered.length === 0){
        //     checksponsered =  await  div.$$eval("._2ABVdq", (elements1) =>{
        //         return elements1
        //     })
        // }
        // console.log("checksponsered : ",checksponsered);
        // if(checksponsered === undefined){
        //     continue
        // }

        const url = await div.$$eval('a[href]', (elements) => {
            return "https://www.flipkart.com" + elements[0].getAttribute("href");
        });
        productUrls.push(url);
    }
    return productUrls;
    }catch (e){
        console.log("error during getting product urls of page : ",e)
        return []
    }
}

async function parseProductPage(tab, url) {
    console.log('parsing ', url);
    await tab.goto(url);
    let variants = {};
    let manuf_detail = "NA";
    let packer_detail = "NA";
    let importer_detail = "NA";
    let variation_map_url = {};
    let spec = []
    // get flipkart category and there map 
    const flipKartCategory1=await tab.$$eval('.r2CdBx', elements => elements.map(element => element.textContent));
    const flipKartCategory=flipKartCategory1.slice(0,-2).join('/');
    console.log("Flipkart category : ",flipKartCategory)
    // console.log("category Mapping : ",categoryMap)
    console.log("picked category Mapping : ",categoryMap[flipKartCategory])
    let super_category = categoryMap[flipKartCategory] ? categoryMap[flipKartCategory]["super_category"]: "NA"
    let category = categoryMap[flipKartCategory]?categoryMap[flipKartCategory]["category"] : "NA"
    let sub_category = categoryMap[flipKartCategory]? categoryMap[flipKartCategory]["sub_category"]: "NA"
    let sub_sub_category = categoryMap[flipKartCategory]?categoryMap[flipKartCategory]["sub_sub_category"] : "NA"
    let sub_sub_category_id = categoryMap[flipKartCategory]?categoryMap[flipKartCategory]["sub_category_id"] : "NA"
    console.log(`super_category : ${super_category}\ncategory:${category}\nsub_category:${sub_category}\nsub_sub_category:${sub_sub_category}\nsub_sub_category_id:${sub_sub_category_id}`)

    // =======================================================varient and variation override section==========================================================
    try {
        const variantsRootDivXpath = '//*[@id="container"]/div/div[3]/div[1]/div[2]/div[3]/div';
        const variantsRootDiv = await tab.$x(variantsRootDivXpath);
        const variantsDiv = await variantsRootDiv[0].$x('*');

        for (const variantDiv of variantsDiv) {
            try {
                const actualVariant = (await variantDiv.$x('*'))[0];
                const variantFields = await actualVariant.$x('*');
                const variantName = variantFields[0];
                const name = await variantName.evaluate(node => node.textContent);
                const variantInnerFields = await variantFields[1].$x('*');
                const variantInnerMostFields = await variantInnerFields[0].$x('*');
                let options = [];
                for (const variantOption of variantInnerMostFields) {
                    const variantInnerOption = (await variantOption.$x('*'));
                    if (variantInnerOption.length > 1) {
                        const optionName = await variantInnerOption[1].evaluate(node => node.innerHTML.match(/<div class="[^"]+">([^<]+)/)[1]);
                        options.push(optionName);
                        if (name.toLowerCase() === "color" || name.toLowerCase() === "colour") {
                            console.log("checkpoint 1");
                            let colorOptionsXpath = './/ul/li/a';
                            const colorOptions = await actualVariant.$x(colorOptionsXpath);
                            // console.log("checkpoint-2 : ",colorOptions)
                            for (let i = 0; i < colorOptions.length; i++) {
                                const colorOption = colorOptions[i];
                                const href = await colorOption.evaluate(node => node.getAttribute('href'));
                                // console.log(`${options[i]} : https://www.flipkart.com${href}`)
                                variation_map_url[options[i]] = `https://www.flipkart.com${href}`
                            }
                        }
                    } else {
                        // click more link
                        await variantInnerOption[0].click();
                        try {
                            await tab.waitForTimeout(1000);
                            const selector = '.QqFHMw.gtm1So';
                            await tab.waitForSelector(selector,{ timeout: 5000 });
                            const element = await tab.$(selector);
                            if (element) {
                                await element.click();
                                console.log(" first cross Element clicked");
                            } else {
                                console.log("first cross Element not found");
                            
                            }

                            await tab.waitForTimeout(1000);
                        } catch (err) {
                            console.log("Error===> :", err);

                        }

                    }
                }
                const variant = {[name]: options};
                variants = {...variants, ...variant};

            } catch (e) {
                console.log("Catch block checkpoint -1",e);
                try {
                    // try {
                    //     await tab.waitForTimeout(1000);
                    //     const selector = '.eVrPKK.ai1jeQ';
                    //     await tab.waitForSelector(selector,{ timeout: 5000 });
                    //     const element = await tab.$(selector);
                    //     if (element) {
                    //         await element.click();
                    //         console.log(" show more-- Element clicked");
                    //     } else {
                    //         console.log("show more-- Element not found");
                    //     }
                    //     await tab.waitForTimeout(1000);
                    // } catch (err) {
                    //     console.log("Error:", err);
                    // }
                  let sizeRawData = await  getVariationData(tab,"Size")
                    size = []
                    for( let item of sizeRawData){
                        size.push(item["divText"])
                    }
                    console.log("size is ",size)
                    variants["Size"] = size
                }catch (e) {
                    console.log("catch block again break during size fetch: ",e)
                }
                try {

                    try {
                        await tab.waitForTimeout(1000);
                        const selector = '.eVrPKK.ai1jeQ';
                        await tab.waitForSelector(selector,{ timeout: 5000 });
                        const element = await tab.$(selector);
                        if (element) {
                            await element.click();
                            console.log(" read more-- Element clicked");
                        } else {
                            console.log("read more-- Element not found");
                        }
                        await tab.waitForTimeout(1000);
                    } catch (err) {
                        console.log("Error --x:", err);
                    }
                    let colorRawData = await  getVariationData(tab,"Color")
                    color = []
                    for( let item of colorRawData){
                        color.push(item["divText"])
                        variation_map_url[item["divText"]] = item["href"]
                    }
                    console.log("color is ",color)
                    variants["Color"] = color
                }catch (e) {
                    console.log("catch block again break during color fetch: ",e)
                }
            }
        }
        console.log("Final varients: ", variants);
        console.log("Variation map url", variation_map_url);

    } catch (e) {
        console.log("code break at vArient ", e);
    }
    // ===========================================================default image section =====================================================================
    let defaultImages = await tab.$$eval('img._0DkuPH', elements => elements.map(element => (element.src).replace("128/128", "832/832")));
    if (defaultImages.length === 0) {
        defaultImages = await tab.$$eval('img._2r_T1I._396QI4', elements => elements.map(element => element.src));
        // console.log("line no 90 image ",images);
    }
    console.log("Default images : ",defaultImages)

    // ==============================================================================Product Name, mrp, price ,discount, ========================================
    let brand = [];
  
    const productName = await tab.$$eval('span.VU-ZEz', elements => elements.map(element => element.textContent));
    const mrp = await tab.$$eval('div.yRaY8j', elements => elements.map(element => element.textContent));
    const price = await tab.$$eval('div.Nx9bqj.CxhGGd', elements => elements.map(element => element.textContent));
    brand = await tab.$$eval('span.mEh187', elements => elements.map(element => element.textContent));
    const discount = await tab.$$eval('.UkUFwK.WW8yVX.dB67CR', elements => elements.map(element => element.textContent));
    let shortDesc = await tab.$$eval('div._4aGEkW', elements => elements.map(element => element.outerHTML));
    if(shortDesc.length === 0){
        shortDesc = await tab.$$eval('.w9jEaj', elements => elements.map(element => element.outerHTML));
    }
    console.log(`Product Name : ${productName} \n MRP: ${mrp}\n Price: ${price}\n Brand: ${brand} \n Discount: ${discount}\n shortDesc: ${shortDesc}\n\n\n`)

    // ======================================================================spec========================================================================
    try{
         spec = await tab.$$eval('.sBVJqn .row', (rows) => {
            const detailsArray = [];
            for (const row of rows) {
                try {
                    const keyElement = row.querySelector('.col-3-12');
                    const valueElement = row.querySelector('.col-9-12');

                    if (keyElement && valueElement) {
                        const key = keyElement.textContent.trim();
                        const value = valueElement.textContent.trim();

                        const detailObject = {[key]: [value]};
                        detailsArray.push(detailObject);
                    }
                } catch (error) {
                    console.error(error);

                }
            }

            return detailsArray;
        });

        if (spec.length === 0 ){
            console.log("again try to find specfication")
            spec = await tab.$$eval('.WJdYP6.row', (rows) => {
                const detailsArray = [];
                for (const row of rows) {
                    try {
                        const keyElement = row.querySelector('.col-3-12');
                        const valueElement = row.querySelector('.col-9-12');
    
                        if (keyElement && valueElement) {
                            const key = keyElement.textContent.trim();
                            const value = valueElement.textContent.trim();
    
                            const detailObject = {[key]: [value]};
                            detailsArray.push(detailObject);
                        }
                    } catch (error) {
                        console.error(error);
    
                    }
                }
    
                return detailsArray;
            });  
        }
        console.log("Specification: " , JSON.stringify(spec))
    }catch (e) {
            console.log("Getting error in spec : ",e)
    }
    
    // Get data from spec 
    let fabric = ["NA"];
    console.log("Type of spec is:",typeof spec)
    fabric = searchByKey(spec,"fabric")
    let sku = searchByKey(spec,"style code")
    console.log("Fabric :", fabric);
  
    if(brand.length === 0){
         brand = searchByKey(spec,"Brand") 
         console.log("brand -1: ",brand)
    }
    if(sku[0] === "NA"){
       sku = [generateRandomString()]
    }
    console.log("SKU :", sku);
  
    // get size and color 

    // Get manufacturer, packer and importer detail 

    try{
        try {
            await tab.waitForTimeout(1000);
            const selector = '.col.col-11-12.rYpYQA';
            await tab.waitForSelector(selector,{ timeout: 5000 });
            const element = await tab.$(selector);

            if (element) {
                await element.click();
                console.log(" + Element clicked");
            } else {
                console.log(" + Element not found");
            }

            await tab.waitForTimeout(1000);
        } catch (err) {
            console.log("Error-y:", err);
            
            await tab.waitForTimeout(1000);
            const selector_1 = '.QqFHMw._4FgsLt';
            await tab.waitForSelector(selector_1,{ timeout: 5000 });
            const element_1 = await tab.$(selector_1);
            if (element_1) {
                await element_1.click();
                console.log(" read  more Element clicked -1");
            }else{
                console.log(" read  more Element not clicked -1");  
            }
        }
        try {
            await tab.waitForTimeout(1000);
            const selector = '.QqFHMw.n4gy8q';
            await tab.waitForSelector(selector,{ timeout: 5000 });
            const element = await tab.$(selector);

            if (element) {
                await element.click();
                console.log(" Read more- Element clicked");
            } else {
                console.log(" Read more- Element not found");
            }

            await tab.waitForTimeout(1000);
        } catch (err) {
            console.log("Error occur at click button:", err);
        }
        try {
            await tab.waitForTimeout(1000);
            let selector ;
            try {
                selector = '.t7DWYS';
                await tab.waitForSelector(selector, {timeout: 5000});
            }catch (e) {
                console.log("in second selector try: " ,e)
                selector = '.rJ5jQ6';
                await tab.waitForSelector(selector, {timeout: 5000});
            }
            const element = await tab.$(selector);
            if (element) {
                await element.click();
                await tab.waitForTimeout(1000);
                console.log(" manfacturur,packer,importer detail Element clicked");
                const elementHandles = await tab.$$('li.S3CJ7s');
                try {
                    if (elementHandles.length === 3) {
                        await elementHandles[0].click();
                        console.log("line no 121 clicked");
                        tab.waitForTimeout(1000);
                        manuf_detail = await tab.$$eval("div.col.afKZtL", elements => elements.map(element => element.textContent));
                        await elementHandles[2].click();
                        console.log("line no 124 clicked");
                        packer_detail = await tab.$$eval("div.col.afKZtL", elements => elements.map(element => element.textContent));
                        await elementHandles[1].click();
                        console.log("line no 127 clicked");
                        importer_detail = await tab.$$eval("div.col.afKZtL", elements => elements.map(element => element.textContent));
                    } else if (elementHandles.length === 2) {
                        await elementHandles[0].click();
                        console.log("line no 121 clicked");
                        manuf_detail = await tab.$$eval("div.col.afKZtL", elements => elements.map(element => element.textContent));
                        await elementHandles[1].click();
                        console.log("line no 124 clicked");
                        packer_detail = await tab.$$eval("div.col.afKZtL", elements => elements.map(element => element.textContent));
                    } else if (elementHandles.length === 0) {
                        await elementHandles[0].click();
                        console.log("line no 121 clicked");
                        manuf_detail = await tab.$$eval("div.col.afKZtL", elements => elements.map(element => element.textContent));
                    }
                } catch (error) {
                    console.error("An error occurred in manufacturing details:", error);
                    // Handle the exception here, such as logging the error or performing fallback actions.
                }
            } else {
                console.log(" manfacturur,packer,importer detail Element not found");
            }

        } catch (err) {
            console.log("Error:", err);
        }

        console.log("mip details======>", manuf_detail, importer_detail, packer_detail);

    }catch(e){
        console.log("error occur ",e);
    }
    
    // get all variation images
    let variation_image_map = {}
    console.log("Variation map url - checkpoint1", variation_map_url);
    for (const [key, value] of Object.entries(variation_map_url)) {
        console.log(`Key: ${key}, Value: ${value}`);
        await tab.goto(value)
        await tab.waitForTimeout(2000);
        let tempImages = await tab.$$eval('img._0DkuPH', elements => elements.map(element => (element.src).replace("128/128", "832/832")));
        if (tempImages.length === 0) {
            tempImages = await tab.$$eval('img._2r_T1I._396QI4', elements => elements.map(element => element.src));
            // console.log("line no 90 image ",images);
        }
        variation_image_map[key] = tempImages
    }
    // console.log('super category:',flipKartCategory,` super cat=>${categoryMap[`${flipKartCategory}`]['super_category']},  cat=>categoryMap[\`${flipKartCategory}\`]['category']  sub_cat=>categoryMap[\`${flipKartCategory}\`]['sub_category']  sub_sub_cat=>categoryMap[\`${flipKartCategory}\`]['sub_sub_category']` )
    return {
        'flipkartCategory':flipKartCategory,
        'super_category': super_category?super_category : 'NA',
        'category': category? category: 'NA',
        'sub_category' :sub_category ? sub_category: 'NA',
        'sub_sub_category': sub_sub_category? sub_sub_category: 'NA',
        'sub_category_id': sub_sub_category_id? sub_sub_category_id: 'NA',
        'brand': brand[0] ? brand[0] : "NA",
        'product_name': productName[0] ? productName[0] : "NA",
        'price': price.length > 0 ? price[0] : "NA",
        'mrp': mrp.length > 0 ? mrp[0] : "NA",
         'size': variants["Size"]  ? variants["Size"].length > 0 ? JSON.stringify(variants["Size"]) :"[]" : "[]",
        'manuf_detail': manuf_detail ? manuf_detail.toString() : "NA",
        'packer_detail': packer_detail ? packer_detail.toString() : "NA",
        'importer_detail': importer_detail ? importer_detail.toString() : "NA",
        'fabric': fabric.length > 0 ? fabric.join(" ") : "NA",
        'short_desc': shortDesc ? shortDesc.toString().slice(0, 32766) : "", // 'long_desc': longDesc?longDesc.toString().slice(0,32767):"",
        'images': defaultImages.length > 0 ? JSON.stringify(defaultImages) : "NA",
        'discount': discount.length > 0 ? discount[0] : "NA",
        'color': variants["Color"] ? variants["Color"].length > 0 ? JSON.stringify(variants["Color"]) :"[]" : "[]",
        'spec': spec.length > 0 ?JSON.stringify(spec) : "[{'':''}]",
        'prod_code':sku.length > 0 ? sku.join("_") : "NA",
        'variants' : variants?JSON.stringify(variants):"",
        "variation_image_map": JSON.stringify(variation_image_map),
        "ref":url
    }

}

function dump(catalogue) {
    let data = [{
        sheet: "Catalogue",
        columns: [
            {label: "flipkartCategory", value: "flipkartCategory"},
            {label: "super_category", value: "super_category"},
            {label: "category",value: "category"},
            {label: "sub_category", value: "sub_category"},
            {label: "sub_sub_category",value: "sub_sub_category"},
            {label: "brand", value: "brand"},
            {label: "prod_code", value: "prod_code"},
            {label: "product_name",value: "product_name"},
            {label: "price", value: "price"},
            {label: "mrp", value: "mrp"},
            {label: "manuf_detail",value: "manuf_detail"},
            {label: "packer_detail", value: "packer_detail"},
            {label: "importer_detail",value: "importer_detail"},
            {label: "discount", value: "discount"},
            {label: "size", value: "size"},
            {label: "fabric",value: "fabric"},
            {label: "short_desc", value: "short_desc"},
            {label: "long_desc", value: "long_desc"},
            {label: "color",value: "color"},
            {label: "specification", value: "spec"},
            {label: "images", value: "images"},
            {label: "variants", value: "variants"}, // Run functions
            {label: "variation_image_map", value: "variation_image_map"},
            {label: "Ref", value: "ref"}
        ],
        content: catalogue,
    }];

    let settings = {
        fileName: "MK_Fashion", // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    }

    xlsx(data, settings);
}
function searchByKey(data, searchKey) {
    const result = data.find(item => Object.keys(item)[0] === searchKey);
    return result ? result[searchKey] : ["NA"];
}
async function getVariationData(page, spanId) {
    const nextDivSelector = `#${spanId} + div`;
    const nextDivContent = await page.evaluate((selector) => {
        const nextDiv = document.querySelector(selector);
        return nextDiv ? nextDiv.innerHTML : null;
    }, nextDivSelector);
    // console.log(liValues);
    return await page.evaluate((htmlContent) => {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = htmlContent;
        const liElements = tempContainer.querySelectorAll('ul.hSEbzK > li');
        return Array.from(liElements).map(li => {
            const link = li.querySelector('a');
            const div = li.querySelector('div.V3Zflw');
            return {
                text: link ? link.textContent.trim() : null,
                href: link ? link.href : null,
                divText: div ? div.textContent.trim() : null
            };
        });
    }, nextDivContent)
}
function generateRandomString(length = 10) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let result = Array.from({ length }, () => characters[Math.floor(Math.random() * charactersLength)]).join('');
    return result;
}
main();

