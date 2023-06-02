import fetch from 'node-fetch'; 
import { JSDOM } from 'jsdom'

async function scrape()
{
	const html = await (await fetch('https://www.homedepot.com/p/Home-Decorators-Collection-Windlowe-61-in-W-x-22-in-D-x-35-in-H-Freestanding-Bath-Vanity-in-White-with-Carrara-White-Marble-Marble-Top-15101-VS61C-WT/303619013')).text()

  const { document } = new JSDOM(html).window

  //Amazon
  //const elem = document.querySelector(".twister-plus-buying-options-price-data")

  //HomeDepot
  const elem = document.querySelector("#thd-helmet__script--productStructureData")

  if (elem !== null){

    //Amazon
    //console.log(JSON.parse(elem.textContent)[0].priceAmount)
  
    //HomeDepot
    console.log(JSON.parse(elem.textContent).offers.price)

  }
  else{
  
    console.log('elem not found in html document')
  
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