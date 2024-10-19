import mongoose from 'mongoose'
import { chromium } from 'playwright'
import { sendMail } from './nodemailer.js'

//const url = new URL('https://www.crutchfield.com/p_537OS237BG/Salamander-Designs-Chameleon-Collection-Oslo-237.html')
//const url = new URL('https://www.homedepot.com/p/Leviton-Decora-15-Amp-Single-Pole-Rocker-AC-Quiet-Light-Switch-White-10-Pack-M32-05601-2WM/202204204')
//const url = new URL('https://www.lowes.com/pd/Whirlpool-26-2-cu-ft-4-Door-French-Door-Refrigerator-with-Ice-Maker-Fingerprint-Resistant-Stainless-Steel/1000318967')

// mongo database credentials
const mongo_db_user = process.env.MONGO_DB_USER;
const mongo_db_password = process.env.MONGO_DB_PASSWORD;
const mongo_db_cluster_domain = process.env.MONGO_DB_CLUSTER_DOMAIN;
const mongo_db_name = process.env.MONGO_DB_NAME;

// initialize database connection
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

  // generate today's date
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const formattedDate = formatter.format(date);
    
  // list of unique emails
  const allEmails = await Listing.distinct('email')

  // iterate through each unique email
  for(const email of allEmails){

    console.log(`email: ${email}`)

    const allListingsPerEmail = await Listing.find({email: email}) // list of listings for this email

    let emailBody = '' // default email body to blank

    let triggerEmail = false // defaul to no email

    // iterate through each listing for this email
    for(const element of allListingsPerEmail){

      console.log(`-checking url: ${element.url}`)
      const price = await getPrice(new URL(element.url))

      if (parseFloat(price) !== parseFloat(element.currentPrice)){

        triggerEmail = true // switch to trigger email

        console.log(`--price changed from ${element.currentPrice} to ${price}`)

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

        emailBody += `URL: ${element.url}\nYesterday's Price: $${previousPrice}\nToday's Price: $${price}\nHighest Price: $${element.highestPrice} on ${element.highestPriceDate}\nLowest Price: $${element.lowestPrice} on ${element.lowestPriceDate}\n\n`

      }
    }

    if(triggerEmail){
      // send email
      console.log(`-sending email to ${email}: ${emailBody.replaceAll('\n','')}\n`)
      sendMail({
        from: `Price Notifier <${process.env.EMAIL_ADDRESS}>`,
        to: email,
        subject: "Price Change Detected",
        text: emailBody
      })
    }

  }

  // close database connection
  mongoose.connection.close()

}

async function getPrice(url){

  const hostname = url.hostname

  // Launch a new browser instance
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to the desired webpage
  await page.goto(url.href);

  let element
  let price
  
  switch(hostname) {
    case 'www.amazon.com':
      // await page.waitForSelector('.a-offscreen');
      element = await page.$('.a-offscreen');
      price = await element.evaluate(el => el.textContent.trim());
      break
  
    case 'www.crutchfield.com':
      await page.waitForSelector('.price.js-price');
      element = await page.$('.price.js-price');
      price = await element.evaluate(el => el.textContent.trim());
      break
  
    case 'www.homedepot.com':
      //elem = document.querySelector(".price-format__large.price-format__main-price")
      break
  
    case 'www.lowes.com':
      //elem = document.querySelector(".item-price-dollar")
      break
  }
  await browser.close()

  return price.replace('$','')
}