import puppeteer from "puppeteer";

const browser = await puppeteer.launch({headless: 'new'});

const page = await browser.newPage();

//const url = new URL('https://www.amazon.com/dp/B092PN2C3M/ref=syn_sd_onsite_desktop_0?ie=UTF8&psc=1&pd_rd_plhdr=t')
//const url = new URL('https://www.crutchfield.com/p_537OS237BG/Salamander-Designs-Chameleon-Collection-Oslo-237.html')
//const url = new URL('https://www.homedepot.com/p/Leviton-Decora-15-Amp-Single-Pole-Rocker-AC-Quiet-Light-Switch-White-10-Pack-M32-05601-2WM/202204204')
const url = new URL('https://www.lowes.com/pd/Whirlpool-26-2-cu-ft-4-Door-French-Door-Refrigerator-with-Ice-Maker-Fingerprint-Resistant-Stainless-Steel/1000318967')

const hostname = url.hostname

await page.goto(url.href, {waitUntil:"networkidle2"})

  // Get page data
  const price = await page.evaluate(hostname => {

    var elem

    switch(hostname) {
      case 'www.amazon.com':
        elem = document.querySelector('.a-offscreen')
        break

      case 'www.crutchfield.com':
        elem = document.querySelector(".price.js-price")
        break

      case 'www.homedepot.com':
        elem = document.querySelector(".price-format__large.price-format__main-price")
        break

      case 'www.lowes.com':
        elem = document.querySelector(".item-price-dollar")
        break
    }

    return elem.textContent.trim()
  
  }, hostname);

console.log(`price: ${price}`);

// Close browser.
await browser.close();