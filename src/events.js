const stripIndent = require("common-tags").stripIndent;
const oneLine = require("common-tags").oneLine;
const auth = require("./core/auth");
const logger = require("./core/logger");
const messageHandler = require("./message");
const db = require("./core/db");
const setStatus = require("./core/status");
const react = require("./commands/translate.react");

const got = require("got");
const translate = require("google-translate-api");

const botVersion = require("../lib/version");
const botCreator = "removed";

exports.listen = function(client)
{
   var config;

   //
   // Client Connected
   //

   client.on("ready", () =>
   {
      db.initializeDatabase();

      //
      // Default Settings
      //

      config = {
         version: botVersion,
         botServer: "https://discord.gg/p4kYenWcCx",
         inviteURL: auth.invite,
         owner: auth.botOwner,
         defaultLanguage: "en",
         translateCmd: "!translate",
         translateCmdShort: "!t",
         maxMulti: 6,
         maxChains: 10,
         maxChainLen: 5,
         maxEmbeds: 5,
         maxTasksPerChannel: 10
      };

      let shard = client.shard;

      if (!shard)
      {
         shard = {
            id: 0,
            count: 1
         };
      }

      if (shard.id === 0)
      {
         console.log(stripIndent`
            ----------------------------------------
            @${client.user.username} Bot is now online
            v.${config.version} | ID: ${client.user.id}
            Made by: ${botCreator}
            ----------------------------------------
         `);
      }

      console.log(oneLine`
         Shard#${shard.id}:  ${shard.id + 1} / ${shard.count} online -
         ${client.guilds.size.toLocaleString()} guilds,
         ${client.channels.size.toLocaleString()} channels,
         ${client.users.size.toLocaleString()} users
      `);

      setStatus(client.user, "online");

      //
      // All shards are online
      //

      if (shard.id === shard.count - 1)
      {
         //
         // Log connection event
         //

         console.log(stripIndent`
            ----------------------------------------
            All shards are online, running intervals
            ----------------------------------------
         `);

         logger("custom", {
            color: "ok",
            msg: oneLine`
               :wave:  **${client.user.username}**
               is now online - \`v.${botVersion}\` -
               **${shard.count}** shards
            `
         });
      }
      translate("Hello World!", {from: "en", to: "nl"}).then(res =>
      {
         console.log(res.text);
      });
   });

   //
   // Recieved Message
   //

   client.on("message", message =>
   {
      global.message = message;
      if (message.guild)
      {
         console.log(`${message.guild.name} - ${message.guild.id}`);
      }
      messageHandler(config, message);
   });

   //
   //  Message edit
   //  Will be fully implemented in future release
   //
 
   //client.on("messageUpdate", (oldMessage, newMessage) =>
   //{
   //   messageHandler(config, oldMessage, newMessage);
   //});

   //
   // Message delete
   //

   //client.on("messageDelete", (message) =>
   //{
   //   messageHandler(config, message, null, true);
   //});

   //
   // Raw events
   //

   client.on("raw", raw =>
   {
      //
      // Listen for reactions
      //

      if (raw.t === "MESSAGE_REACTION_ADD")
      {
         react(raw.d, client);
      }
   });

   //
   // Log Client Errors/Warnings
   //

   client.on("error", err =>
   {
      return logger("error", err);
   });

   client.on("warning", info =>
   {
      return logger("warn", info);
   });

   client.on("disconnect", event =>
   {
      return logger("error", event);
   });

   //
   // Proccess-related errors
   //

   process.on("uncaughtException", err =>
   {
      logger("dev", err);
      return logger("error", err, "uncaught");
   });

   process.on("unhandledRejection", (reason, p) =>
   {
      const err = "Unhandled Rejection at:" + JSON.stringify(p) + "\ncode:" + reason.code + "\n" + reason.stack;
      logger("dev", err);

      if (err.includes("403 (Forbidden)"))
      {
         got.delete("https://api.heroku.com/apps/" + process.env.APP_NAME + "/dynos/",
            {
               headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/vnd.heroku+json; version=3",
                  "Authorization": "Bearer " + process.env.API_TOKEN
               }
            });
      }

      return logger("error", err, "unhandled");
   });

   process.on("warning", warning =>
   {
      logger("dev", warning);
      return logger("error", warning, "warning");
   });

   //
   // Delete/leave/change events
   //

   client.on("channelDelete", channel =>
   {
      db.removeTask(channel.id, "all", function(err)
      {
         if (err)
         {
            return logger("error", err);
         }
      });
   });

   client.on("guildDelete", guild =>
   {
      logger("guildLeave", guild);
      db.removeServer(guild.id);
   });

   client.on("guildUnavailable", guild =>
   {
      return logger("warn", "Guild unavailable:" + guild.id);
   });

   //
   // Guild join
   //

   client.on("guildCreate", guild =>
   {
      logger("guildJoin", guild);
      db.addServer(guild.id, config.defaultLanguage, db.Servers);
   });
};
