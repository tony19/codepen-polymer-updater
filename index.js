require('dotenv').config()
const puppeteer = require('puppeteer');
const request = require('request-promise-native');

async function loginToCodepen(page) {
  await page.goto('https://codepen.io/login');
  if (await isLoggedIn(page)) {
    return;
  }
  await page.type('#login-email-field', process.env.CODEPEN_USER, {delay: 100});
  await page.type('#login-password-field_', process.env.CODEPEN_PWD, {delay: 100});
  await page.click('#log-in-button');
  console.log('handle the CAPTCHA challenge...i\'ll wait :)');
  await page.waitForNavigation({timeout: 0});
}

async function isLoggedIn(page) {
  const loggedIn = await page.$$('body.logged-out');
  return loggedIn.length === 0;
}

async function updatePens(page) {
  let numUpdated = 0;
  const pageIndex = 1;
  const searchTerm = 'polymer';
  await page.goto(`https://codepen.io/dashboard?type=search&opts_itemType=pen&opts_searchTerm=${searchTerm}&opts_order=popularity&opts_depth=everything&opts_showForks=true&displayType=list&previewType=iframe&page=${pageIndex}`);

  while (true) {
    await page.waitForSelector('.title a');
    const penUrls = await page.$$eval('.title a', anchors => Array.from(anchors).map(a => a.href));
    for (const url of penUrls) {
      await page.goto(url);
      const isUpdated = await updatePen(page);
      if (isUpdated) {
        await page.waitFor(700);
        numUpdated++;
      }
      console.log(`${url}${isUpdated ? '✅' : ''}`);
      await page.goBack();
      await page.waitFor(Math.random() * 100);
    }

    // click next
    const nextBtn = await page.$$('.pagination-button:nth-child(2)');
    if (nextBtn.length === 0) {
      break;
    }
    await page.click('.pagination-button:nth-child(2)');
    await page.waitFor(5000);
  }
  return numUpdated;
}

async function updatePen(page) {
  return await page.evaluate(() => {
    const replacements = [
      {
        search: /\/\/polygit.org\/polymer\+:?v?1.*\/components\//ig,
        replacement: '//cdn.rawgit.com/download/polymer-cdn/1.8.0/lib/',
      },
      {
        search: /\/\/polygit.org\/polymer\+:?v?2.*\/components\//ig,
        replacement: '//cdn.rawgit.com/download/polymer-cdn/2.6.0.2/lib/',
      },
      {
        search: /webcomponents-lite.min.js/ig,
        replacement: 'webcomponents-lite.js',
      }
    ];

    const codeMirror = document.querySelector('.CodeMirror').CodeMirror;
    let code = codeMirror.getValue();

    let isUpdated = false;
    for (const {search, replacement} of replacements) {
      if (search.test(code)) {
        code = code.replace(search, replacement);
        isUpdated = true;
      }
    }

    if (isUpdated) {
      codeMirror.setValue(code);
      document.querySelector('#update').click();
    }

    return isUpdated;
  });
}

async function getBrowserDebuggerUrl() {
  let config = null;
  try {
    config = await request.get({
      uri: 'http://0.0.0.0:9222/json/version',
      json: true
    });
  } catch (e) {
    console.warn('no puppeteer instance found');
  }
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
    const numUpdated = await updatePens(page);
    console.log(`updated ${numUpdated} pen(s)`);
  } finally {
    //await browser.close();
  }
})();