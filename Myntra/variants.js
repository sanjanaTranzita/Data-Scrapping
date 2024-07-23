const reader = require('xlsx')
let xlsx = require("json-as-xlsx")



let finaldata = [];
const read = reader.readFile("H&M_1-10.xlsx")
read.SheetNames.forEach(sheet => {
    fileData = reader.utils.sheet_to_json(read.Sheets[sheet])
})



for (let i = 0; i < fileData.length; i++) {
     // let tempcolour = fileData[i]['color'] ? fileData[i]['color'] : ''
    // fileData[i]['variants'] = fileData[i]['variants'] = JSON.stringify({
    //     "size": fileData[i]['size'].split(','),
    //     "color": fileData[i]['color'] ? fileData[i]['color'].split(',') : []
    // });
    fileData[i]['variants'] = JSON.stringify({
        "size": fileData[i]['size'].split(','),
        "color": fileData[i]['color'] === "NA" ? [] : (fileData[i]['color'] ? fileData[i]['color'].split(',') : [])
    });

}

    let data = [{
        sheet: "Catalogue",
        columns: [
            // {label: "super_category", value: "super_category"},
            {label: "super_category", value: "super_category"},
            // {label: "category",value: "category"},
            {label: "category",value: "category"},
            // {label: "sub_category",value: "sub_category"},
            {label: "sub_category",value: "sub_category"},
            // {label: "sub_sub_category", value: "sub_sub_category"},
            {label: "sub_sub_category", value: "sub_sub_category"},
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
            {label: "variants",value: "variants"},
            {label: "short_desc",value: "short_desc"},
            {label: "long_desc", value: "long_desc"},
            {label: "color", value: "color"},
            {label: "specification",value: "specification"},
            {label: "images", value: "images"}// Run functions
        ], content: fileData,
    }];

    let settings = {
        fileName: "UpdatedH&M_1-10", // Name of the resulting spreadsheet
        extraLength: 3, // A bigger number means that columns will be wider
        writeMode: "writeFile", // The available parameters are 'WriteFile' and 'write'. This setting is optional. Useful in such cases https://docs.sheetjs.com/docs/solutions/output#example-remote-file
        writeOptions: {}, // Style options from https://docs.sheetjs.com/docs/api/write-options
    }

    xlsx(data, settings);
// }

console.log("hi",fileData[0])

