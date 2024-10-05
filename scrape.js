import crypto from 'crypto'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import puppeteer from 'puppeteer'
import {google} from 'googleapis'
const OAuth2 = google.auth.OAuth2

dotenv.config()

//const url = new URL('https://www.amazon.com/Monolith-THX-365IW-Certified-Neodymium-Shorting/dp/B07YLZ3R4T/ref=sr_1_1?crid=OQGA9VD0NQEQ&dib=eyJ2IjoiMSJ9.wcTrK6uPvvgqXpMZ70oj2mgcts5zyy4NJc0mDwg7LkQ.ImXL24hGLY6jgeFsbvcCVxpmz0BJl-mAcet_SLuOsFU&dib_tag=se&keywords=365iw&qid=1728138449&s=electronics&sprefix=365iw%2Celectronics%2C145&sr=1-1&ufe=INHOUSE_INSTALLMENTS%3AUS_IHI_5M_HARDLINES_AUTOMATED'.split('?')[0])
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
  
  await mongoose.connect(`mongodb+srv://${mongo_db_user}:${mongo_db_password}@${mongo_db_cluster_domain}/${mongo_db_name}`)

  const listingSchema = new mongoose.Schema({
    _id: String,
    email: String,
    url: String,
    currentPrice: Number,
    highestPrice: Number,
    highestPriceDate: String,
    lowestPrice: Number,
    lowestPriceDate: String,
    active: Boolean
  })
  
  const Listing = mongoose.model('Listing', listingSchema);

  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const formattedDate = formatter.format(date);
    
  const allListings = await Listing.find()

  for(const element of allListings){

    var price = await getPrice(new URL(element.url))

    if (parseFloat(price) !== parseFloat(element.currentPrice)){

      console.log(`price changed from ${element.currentPrice} to ${price}`)

      var previousPrice = element.currentPrice
      //element.currentPrice = parseFloat(price)
      element.highestPrice = parseFloat(price) > parseFloat(element.highestPrice) ? parseFloat(price) : parseFloat(element.highestPrice)
      element.highestPriceDate = parseFloat(price) > parseFloat(element.highestPrice) ? formattedDate : element.highestPriceDate
      element.lowestPrice = parseFloat(price) < parseFloat(element.lowestPrice) ? parseFloat(price) : parseFloat(element.lowestPrice)
      element.lowestPriceDate = parseFloat(price) < parseFloat(element.lowestPrice) ? formattedDate : element.highestPriceDate

      // save updated element
      await element.save()

      // email options
      const mailOptions = {
        from: `Price Notifier <${process.env.EMAIL_ADDRESS}>`,
        to: element.email,
        subject: "Price Change Detected",
        text: `URL: ${element.url}\nYesterday's Price: $${previousPrice}\nToday's Price: $${price}\nHighest Price: $${element.highestPrice} on ${element.highestPriceDate}\nLowest Price: $${element.lowestPrice} on ${element.lowestPriceDate}`
      }          

      // send email
      sendMail(mailOptions)

    }
  }

  mongoose.connection.close()

}

async function getPrice(url){

  console.log(`url: ${url}`)

  const hostname = url.hostname

  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url.href)

  var element
  var price
  
  switch(hostname) {
    case 'www.amazon.com':
      await page.waitForSelector('.a-offscreen');
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

  //console.log(`price: ${price}`)
  return price.replace('$','')
}

const createTransporter = async () => {
  try {
    const oauth2Client = new OAuth2(
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.OAUTH_REFRESH_TOKEN,
    });

    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.log("*ERR: ", err)
          reject();
        }
        resolve(token); 
      });
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL_ADDRESS,
        accessToken,
        clientId: process.env.OAUTH_CLIENT_ID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
      },
    });
    return transporter;
  } 
  catch (err) {
    return err
  }
};

const sendMail = async (mailOptions) => {
  try {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(mailOptions);
  }
  catch (err) {
    console.log("ERROR: ", err)
  }
};