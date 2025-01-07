const fs = require("fs");
module.exports = {
    name: "quote",
    execute(client, channel, _, args, quotes) {
      const statusConfig = JSON.parse(fs.readFileSync("./src/status.json", "utf8"));
      if (!statusConfig.commands.quote) {
        client.say(channel, "❌ The 'quote' command is currently disabled.");
        return;
      }
      
      if (quotes.length === 0) {
        client.say(channel, "No quotes available.");
        return;
      }
  
      if (args.length === 1) {
        // Random quote
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        client.say(channel, `Quote #${randomQuote.index}: "${randomQuote.quote}" - ${randomQuote.author}`);
      } else {
        const index = parseInt(args[1], 10);
        if (isNaN(index) || index < 1 || index > quotes.length) {
          client.say(channel, "Quote not found.");
          return;
        }
        const quote = quotes[index - 1];
        client.say(channel, `Quote #${quote.index}: "${quote.quote}" - ${quote.author}`);
      }
    },
  };
  