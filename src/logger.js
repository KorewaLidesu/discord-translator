const auth = require("./core/auth");
const Discord = require('discord.js');
const request = require('request');

client.on('message', message => {
  if (auth.readch.includes(message.channel.id)) {
    let content = message.content;
    message.attachments.forEach(attachment => {
      content += '\n' + attachment.proxyURL;
    });

    auth.writech.forEach(channel => {
      client.channels.get(channel).send(content, {embed: message.embeds[0]}).catch(err => {
        console.error(err);
      });
    });

    auth.webhook.forEach(webhook => {
      request({
        url: webhook,
        method: 'POST',
        json: {
          content: content,
          embeds: message.embeds,
        },
      }, err => {
        if (err) {
          console.error(err);
        }
      });
    });
  }
});
