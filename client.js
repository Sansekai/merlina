const { Client, LocalAuth } = require("whatsapp-web.js");
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    executablePath: process.env.NODE_ENV == 'production' ? '/usr/bin/chromium-browser' : undefined,
    args: ['--no-sandbox', '--headless', '--disable-gpu']
  },
});

module.exports = client;
