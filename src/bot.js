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
const messlogger = require("./messlogger");

events.listen(client);
events.listen(messlogger);

//
// Initialize Bot
//

client.login(auth.token);
