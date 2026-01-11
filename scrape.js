import mongoose from 'mongoose';
import { chromium } from 'playwright';
import { sendMail } from './nodemailer.js';
import { getAmazonPrice } from './scrapers/amazon.js'; // <-- Amazon scraper module

// MongoDB credentials
const mongo_db_user = process.env.MONGO_DB_USER;
const mongo_db_password = process.env.MONGO_DB_PASSWORD;
const mongo_db_cluster_domain = process.env.MONGO_DB_CLUSTER_DOMAIN;
const mongo_db_name = process.env.MONGO_DB_NAME;

main().catch(err => console.log(err));

async function main() {
  // Connect to database
  await mongoose.connect(`mongodb+srv://${mongo_db_user}:${mongo_db_password}@${mongo_db_cluster_domain}/${mongo_db_name}`);

  // Define schema
  const listingSchema = new mongoose.Schema({
    email: String,
    url: String,
    currentPrice: Number,
    highestPrice: Number,
    highestPriceDate: String,
    lowestPrice: Number,
    lowestPriceDate: String,
    active: Boolean
  });

  const Listing = mongoose.model('listings', listingSchema);

  // Launch browser
  const browser = await chromium.launch({ headless: true });

  const formatter = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const formattedDate = formatter.format(new Date());
  console.log(new Date().toLocaleString());

  const allEmails = await Listing.distinct('email');

  for (const email of allEmails) {
    console.log(`-email: ${email}`);

    const allListingsPerEmail = await Listing.find({ email });
    if (!allListingsPerEmail.length) continue;

    let emailBody = '';
    let triggerEmail = false;

    // Reuse one browser context per email
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7 AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36)'
    });

    for (const element of allListingsPerEmail) {
      console.log(`--checking url: ${element.url}`);

      const page = await context.newPage();
      try {
        const price = await getPrice(page, new URL(element.url));

        if (price === null) {
          console.log('--- no price available (sold out or not found)');
          continue;
        }

        if (price !== Number(element.currentPrice)) {
          triggerEmail = true;
          console.log(`---price changed from ${element.currentPrice} to ${price}`);

          const previousPrice = element.currentPrice;
          element.currentPrice = price;

          if (price > Number(element.highestPrice)) {
            element.highestPrice = price;
            element.highestPriceDate = formattedDate;
          }

          if (price < Number(element.lowestPrice)) {
            element.lowestPrice = price;
            element.lowestPriceDate = formattedDate;
          }

          await element.save();

          emailBody +=
            `URL: ${element.url}\n` +
            `Price Change: $${previousPrice} => $${price}\n` +
            `Highest Price: $${element.highestPrice} on ${element.highestPriceDate}\n` +
            `Lowest Price: $${element.lowestPrice} on ${element.lowestPriceDate}\n\n`;
        } else {
          console.log(`---no price change from ${element.currentPrice}`);
        }

      } catch (e) {
        console.error('--- scrape error:', e.message);
      } finally {
        await page.close();
      }
    }

    if (triggerEmail) {
      console.log(`--sending email to ${email}`);
      sendMail({
        from: `Price Notifier <${process.env.EMAIL_ADDRESS}>`,
        to: email,
        subject: "Price Change Detected",
        text: emailBody
      });
    }

    // Close context per email
    await context.close();
  }

  await browser.close();
  mongoose.connection.close();
}

//
// ----------------------- GET PRICE -----------------------
//
async function getPrice(page, url) {
  const hostname = url.hostname.toLowerCase();

  if (hostname.includes('amazon.com')) {
    return await getAmazonPrice(page, url);
  }

  // Add other retailers here in the future:
  // else if (hostname.includes('lowes.com')) { ... }

  console.log(`--- unsupported hostname: ${hostname}`);
  return null;
}
