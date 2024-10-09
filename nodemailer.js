import dotenv from 'dotenv'
import {google} from 'googleapis'
import nodemailer from 'nodemailer'

dotenv.config()

const OAuth2 = google.auth.OAuth2

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
          console.log("Error getting OAuth Access Token: ", err)
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
    console.log("Error creating transporter: ", err)
    return err
  }
};

const sendMail = async (mailOptions) => {
  try {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(mailOptions);
  }
  catch (err) {
    console.log("Error sending mail: ", err)
  }
};

export { sendMail }