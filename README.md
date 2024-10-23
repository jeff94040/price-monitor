# price-monitor

## Prerequisites

* Git
* Node.js
* NPM

## Installation
Open a terminal and ```cd``` to the app's parent directory, then run:

```
$ git clone https://github.com/jeff94040/price-monitor.git
$ cd price-monitor/
$ npm install
```

## Configuration

Create the file ```price-monitor/.env``` and set the following values:

```
PORT=3001

# mongo database credentials
MONGO_DB_CLUSTER_DOMAIN = ""
MONGO_DB_NAME = ""
MONGO_DB_USER = ""
MONGO_DB_PASSWORD = ""

# email
EMAIL_PROVIDER = ""
EMAIL_ADDRESS = ""
EMAIL_PASSWORD = ""
OAUTH_CLIENT_ID = ""
OAUTH_CLIENT_SECRET = ""
OAUTH_REFRESH_TOKEN = ""