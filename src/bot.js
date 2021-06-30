//
// Main Libraries
//

require("dotenv").config();
const discord = require("discord.js");
const client = new discord.Client();
const auth = require("./core/auth");

//
// Event Listener
//

const events = require("./events");
const logger = require("./logger");

events.listen(client);
events.listen(logger);

//
// Initialize Bot
//

client.login(auth.token);
