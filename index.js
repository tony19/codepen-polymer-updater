require('dotenv').config()
const puppeteer = require('puppeteer');
const request = require('request-promise-native');

async function loginToCodepen(page) {
  await page.goto('https://codepen.io/login')
  await page.type('#login-email-field', process.env.CODEPEN_USER)
  await page.type('#login-password-field_', process.env.CODEPEN_PWD)
  await page.click('#log-in-button')
  await page.waitForNavigation()
}

async function getPens(page) {
  let pageIndex = 6;
  let searchTerm = 'polymer';
  await page.goto(`https://codepen.io/dashboard?type=search&opts_itemType=pen&opts_searchTerm=${searchTerm}&opts_order=popularity&opts_depth=everything&opts_showForks=true&displayType=list&previewType=iframe&page=${pageIndex}`);
  await page.waitForSelector('.title a');
  const links = await page.evaluate(() => {
    const links = document.querySelectorAll('.title a');
    console.log({links});
  });
}

async function getBrowserDebuggerUrl() {
  let config = null;
  config = await request.get({
    uri: 'http://0.0.0.0:9222/json/version',
    json: true
  });
  return config && config.webSocketDebuggerUrl;
}

async function getBrowser() {
  const browserWSEndpoint = await getBrowserDebuggerUrl();
  if (browserWSEndpoint) {
    return puppeteer.connect({
      browserWSEndpoint,
    });
  } else {
    return puppeteer.launch({
      headless: false,
      args: [
        '--remote-debugging-address=0.0.0.0',
        '--remote-debugging-port=9222',
      ]
    });
  }
}

(async () => {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await loginToCodepen(page);
    await getPens(page);
    // await page.screenshot({
    //     path: 'full.png',
    //     fullPage: true
    // });
  } finally {
    //await browser.close();
  }
})();