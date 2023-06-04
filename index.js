import fetch from 'node-fetch'; 
import jsdom from 'jsdom'
const { JSDOM } = jsdom;

async function scrape(){

  const url = new URL('https://www.amazon.com/dp/B092PN2C3M/ref=syn_sd_onsite_desktop_0?ie=UTF8&psc=1&pd_rd_plhdr=t')
  //const url = new URL('https://www.homedepot.com/p/Leviton-Decora-15-Amp-Single-Pole-Rocker-AC-Quiet-Light-Switch-White-10-Pack-M32-05601-2WM/202204204')
  //const url = new URL('https://www.crutchfield.com/p_537OS237BG/Salamander-Designs-Chameleon-Collection-Oslo-237.html')
  //const url = new URL('https://www.lowes.com/pd/Whirlpool-24-5-cu-ft-4-Door-French-Door-Refrigerator-with-Ice-Maker-Fingerprint-Resistant-Stainless-Steel-ENERGY-STAR/1000257811')

  const options = {
    headers: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  }

  console.log('fetching...')
  const http = await fetch(url, options)
  console.log('converting response to text...')
	const html = await http.text()
  console.log('converted response to text...')

  const virtualConsole = new jsdom.VirtualConsole();
  const dom = new JSDOM(html, { virtualConsole });
  const document = dom.window.document
  //console.log(document.body.outerHTML)

  var elem

  switch(url.hostname) {

    case 'www.amazon.com':
      elem = document.querySelector(".a-offscreen")
      if (elem != null)
        console.log(elem.textContent)
      else
        console.log('elem not found in html document')
      break
      
    case 'www.homedepot.com':
      elem = document.querySelector(".price-format__large.price-format__main-price")
      if (elem != null)
        console.log(elem.textContent)
      else
        console.log('elem not found in home depot document')
      break
    
    case 'www.crutchfield.com':
      elem = document.querySelector(".price.js-price")
      if (elem != null)
        console.log(elem.textContent.trim())
      else
      console.log('elem not found in html document')
      break

    case 'www.lowes.com':
      elem = document.querySelector("#bundled-carousel-better-together-atc-333346-44211-L51844481000842744")
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