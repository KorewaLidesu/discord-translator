const auth = require("./core/auth");
const request = require('request');

exports.listen = function(client)

client.on('message', messagelogger => {
  if (auth.readch.includes(messagelogger.channel.id)) {
    let content = messagelogger.content;
    messagelogger.attachments.forEach(attachment => {
      content += '\n' + attachment.proxyURL;
    });

    auth.writech.forEach(channel => {
      client.channels.get(channel).send(content, {embed: messagelogger.embeds[0]}).catch(err => {
        console.error(err);
      });
    });

    auth.webhook.forEach(webhook => {
      request({
        url: webhook,
        method: 'POST',
        json: {
          content: content,
          embeds: messagelogger.embeds,
        },
      }, err => {
        if (err) {
          console.error(err);
        }
      });
    });
  }
});
