// scrapers/amazon.js
export async function getAmazonPrice(page, url) {
  try {
    await page.goto(url.href, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body', { timeout: 15000 });

    // Check if product is unavailable
    if (await isAmazonUnavailable(page)) {
      console.log('--- product unavailable');
      return null;
    }

    // List of price selectors (classic, deal, modern, apex layouts)
    const priceSelectors = [
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#corePrice_feature_div span.a-price > span.a-offscreen',
      '#corePriceDisplay_desktop_feature_div span.a-price > span.a-offscreen',
      '#apex_desktop span.a-price > span.a-offscreen'
    ];

    let rawPrice = null;

    for (const selector of priceSelectors) {
      const loc = page.locator(selector).first();
      if (await loc.count()) {
        const text = (await loc.textContent({ timeout: 10000 }))?.trim();
        if (text && text.length > 0) {
          rawPrice = text;
          break;
        }
      }
    }

    if (!rawPrice) {
      console.log('--- no price element found or empty');
      return null;
    }

    // Normalize and parse
    const normalized = rawPrice.replace(/,/g, '');
    const match = normalized.match(/\d+(\.\d+)?/);

    if (!match) {
      console.log(`--- could not parse price from: "${rawPrice}"`);
      return null;
    }

    const price = parseFloat(match[0]);
    console.log(`--- price detected: ${price}`);
    return price;

  } catch (e) {
    console.error('--- getAmazonPrice error:', e.message);
    return null;
  }
}

async function isAmazonUnavailable(page) {
  const selectors = [
    '#availability span:has-text("Currently unavailable")',
    '#availability span:has-text("Unavailable")',
    '#outOfStock',
    'text=Currently unavailable'
  ];

  for (const selector of selectors) {
    if (await page.locator(selector).count()) {
      return true;
    }
  }
  return false;
}
