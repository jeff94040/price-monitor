import mongoose from 'mongoose'
import { chromium } from 'playwright'
import { sendMail } from './nodemailer.js'

// mongo database credentials
const mongo_db_user = process.env.MONGO_DB_USER;
const mongo_db_password = process.env.MONGO_DB_PASSWORD;
const mongo_db_cluster_domain = process.env.MONGO_DB_CLUSTER_DOMAIN;
const mongo_db_name = process.env.MONGO_DB_NAME;

main().catch(err => console.log(err));

async function main(){
  
  // connect to database
  await mongoose.connect(`mongodb+srv://${mongo_db_user}:${mongo_db_password}@${mongo_db_cluster_domain}/${mongo_db_name}`)

  // define database schema
  const listingSchema = new mongoose.Schema({
    email: String,
    url: String,
    currentPrice: Number,
    highestPrice: Number,
    highestPriceDate: String,
    lowestPrice: Number,
    lowestPriceDate: String,
    active: Boolean
  })
  
  // define model
  const Listing = mongoose.model('listings', listingSchema);

  // launch a new browser instance
  const browser = await chromium.launch();

  // generate dates / timestamps
  const formatter = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const formattedDate = formatter.format(new Date());
  console.log(new Date().toLocaleString())
    
  // list of unique emails
  const allEmails = await Listing.distinct('email')

  // iterate through each unique email
  for(const email of allEmails){

    console.log(`-email: ${email}`)

    const allListingsPerEmail = await Listing.find({email: email}) // list of listings for this email

    let emailBody = '' // default email body to blank

    let triggerEmail = false // defaul to no email

    // iterate through each listing for this email
    for(const element of allListingsPerEmail){

      console.log(`--checking url: ${element.url}`)
      try{
        const price = await getPrice(browser, new URL(element.url))


      if (parseFloat(price) !== parseFloat(element.currentPrice)){

        triggerEmail = true // switch to trigger email

        console.log(`---price changed from ${element.currentPrice} to ${price}`)

        const previousPrice = element.currentPrice
        element.currentPrice = parseFloat(price)
        if(parseFloat(price) > parseFloat(element.highestPrice)){
          element.highestPrice = parseFloat(price)
          element.highestPriceDate = formattedDate
        }
        if(parseFloat(price) < parseFloat(element.lowestPrice)){
          element.lowestPrice = parseFloat(price)
          element.lowestPriceDate = formattedDate
        }

        // save updated element
        await element.save()

        emailBody += `URL: ${element.url}\nPrice Change: $${previousPrice} => $${price}\nHighest Price: $${element.highestPrice} on ${element.highestPriceDate}\nLowest Price: $${element.lowestPrice} on ${element.lowestPriceDate}\n\n`

      }
      else{
        console.log(`---no price change ${element.currentPrice} to ${price}`)
      }
    }
    catch (e){
      console.log(e)
    }
    }// close listings per email loop

    if(triggerEmail){
      // send email
      console.log(`--sending email to ${email}: ${emailBody.replaceAll('\n','')}\n`)
      sendMail({
        from: `Price Notifier <${process.env.EMAIL_ADDRESS}>`,
        to: email,
        subject: "Price Change Detected",
        text: emailBody
      })
    }

  }// close per email loop

  // close browser
  await browser.close()

  // close database connection
  mongoose.connection.close()

}

async function getPrice(browser, url){

  const hostname = url.hostname

  // create a new browser page
  const page = await browser.newPage();

  // return the main resource response
  await page.goto(url.href);

  let element
  //let price
  
  switch(hostname) {
    case 'www.amazon.com':
      element = page.locator('.a-offscreen').first();
      break
  
    case 'www.crutchfield.com':
      /*
      await page.waitForSelector('.price.js-price');
      */
      break
  
    case 'www.homedepot.com':
      //elem = document.querySelector(".price-format__large.price-format__main-price")
      break
  
    case 'www.lowes.com':
      //elem = document.querySelector(".item-price-dollar")
      break
  }

  await element.waitFor('attached');
  const price = (await element.textContent()).trim().replace('$','')
  return price
}