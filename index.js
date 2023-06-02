import fetch from 'node-fetch'; 
import jsdom from 'jsdom'
const { JSDOM } = jsdom;

async function scrape(){

  const url = new URL('https://www.lowes.com/pd/Whirlpool-24-5-cu-ft-4-Door-French-Door-Refrigerator-with-Ice-Maker-Fingerprint-Resistant-Stainless-Steel-ENERGY-STAR/1000257811')

  const options = {
    headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'}
  }

	const html = await (await fetch(url, options)).text()

  const virtualConsole = new jsdom.VirtualConsole();
  const dom = new JSDOM(html, { virtualConsole });
  const document = dom.window.document
  //console.log(document)

  var elem

  switch(url.hostname) {

    case 'www.amazon.com':
      elem = document.querySelector(".twister-plus-buying-options-price-data")
      if (elem != null)
        console.log(JSON.parse(elem.textContent)[0].priceAmount)
      else
        console.log('elem not found in html document')
      break
      
    case 'www.homedepot.com':
      elem = document.querySelector("#thd-helmet__script--productStructureData")
      if (elem != null)
        console.log(JSON.parse(elem.textContent).offers.price)
      else
        console.log('elem not found in html document')
      break
    
    case 'www.lowes.com':
      elem = document.querySelector(".screen-reader")
      if (elem != null)
        console.log(elem.textContent)
      else
        console.log('elem not found in html document')
      break
  }
}

scrape();


/*
Amazon
document.querySelector("#attach-base-product-price")
document.querySelector("#priceValue")
document.querySelector("#twisterPlusPriceSubtotalWWDesktop_feature_div > div.a-section.aok-hidden.twister-plus-buying-options-price-data")
NO document.querySelector("#base-product-price")
document.querySelector("#twisterPlusPriceSubtotalWWDesktop_feature_div > div.a-section.aok-hidden.twister-plus-buying-options-price-data")

HomeDepot
document.querySelector("#sticky-nav > div > div > div > div.sticky-nav__row > div.sticky-nav__product_details_wrapper > div.grid.flush.sticky-nav__brand_and_price.sticky-nav__row > div.sticky-nav__price.col__5-12.col__5-12--xs.col__4-12--sm")

document.querySelector("#standard-price > div > div > span:nth-child(2)")
document.querySelector("#standard-price > div > div > span:nth-child(3)")

document.querySelector("#thd-helmet__script--productStructureData")

*/