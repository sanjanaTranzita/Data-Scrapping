const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });
  const page = await browser.newPage();

  // Navigate to the initial URL
  await page.goto('https://www.limeroad.com/all?stock[]=1&src_id=searchbrand__0&position=0&f_ref=searchOnAutoCompleteBrand&brandid[]=75905');

  try {
    const elementXPath = '//*[@id="breadcrumbs"]';
    await page.waitForXPath(elementXPath);

    // Find the element using XPath
    const elementHandle = await page.$x(elementXPath);

    // Click on the element
    await elementHandle[0].click();

    console.log(`Clicked on element with XPath: ${elementXPath}`);
    let reachedBottom = false;

    const scrollDuration = 40 * 1000; // 15 seconds
  const endTime = Date.now() + scrollDuration;

  // Continuously press the down arrow key until the specified duration is reached
  while (Date.now() < endTime) {
    await page.keyboard.press('ArrowDown');
    // Adjust the delay as needed to control the scrolling speed
    await page.waitForTimeout(50); // 100 milliseconds
  }
  } catch (error) {
    console.error('Error:', error);
  }
})();
