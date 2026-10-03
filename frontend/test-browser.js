const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });

  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    console.log('Waiting 3 seconds...');
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    console.log('Navigation failed:', err);
  } finally {
    await browser.close();
  }
})();
