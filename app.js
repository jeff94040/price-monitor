import dotenv from 'dotenv';
import express from 'express';
//import path, {dirname} from 'path';
//import { fileURLToPath } from 'url';

// import config props from .env file
dotenv.config()

// Express web app framework
var app = express()
const port = process.env.PORT

// Trust front-facing proxies 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7
app.set('trust proxy', 'uniquelocal')

// Body parser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false}))

// Set folder location for static content
//const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static('front-end',{index: 'login.html', extensions: ['html']})); 
app.use(express.static('node_modules/bootstrap/dist/'))

/*app.get('/', (req, res) => {
  res.sendStatus(200)
})*/

app.listen(port, () => {
  console.log(`price-monitor listening on http://localhost:${port}`)
});