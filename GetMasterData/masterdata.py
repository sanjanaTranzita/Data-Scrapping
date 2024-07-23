import json
file=open('catalog-full.json')
vanijAttribute = open('vanijAttribute.json', 'r', encoding='utf-8')
catalogdata=json.load(file)['result']
vanijAttributeData = json.load(vanijAttribute)['data']
masterData=[]
def extractData(id):
    filtered_data = [item for item in vanijAttributeData if item['data']['sub_sub_category_id'] == id]
    extracted_data = [{"name": item['data']['name'], "values": item['data']['values']} for item in filtered_data]
    converted_data=[{item['name']:item['values']} for item in extracted_data]
    return converted_data
i=0
for catalog in catalogdata:
    catalog["attribute"]=extractData(catalog['sub_sub_category_id'])
    i+=1
    print("catalog done: ",i+1)

with open("catalogs_with_attribute.json", "w") as json_file:
    json.dump({'data':catalogdata}, json_file, indent=4)
