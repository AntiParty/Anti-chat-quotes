const fs = require("fs");

module.exports = {
  name: "addquote",
  description: "Adds a new quote attributed to a user.",
  execute(client, channel, userstate, args, quotes, config) {
    const statusConfig = JSON.parse(fs.readFileSync("./src/status.json", "utf8"));
    if (!statusConfig.commands.addquote) {
      client.say(channel, "❌ The 'addquote' command is currently disabled.");
      return;
    }

    const isMod =
      userstate.mod || userstate["user-type"] === "mod" || userstate.badges?.broadcaster;

    if (!isMod) {
      client.say(channel, "You don't have permission to use this command.");
      return;
    }

    // Extract the arguments and validate the format
    const rawArgs = args.slice(1).join(" "); // Combine all arguments after the command
    const match = rawArgs.match(/^@(\w+)\s(.+)/); // Match "@username quote text"

    if (!match) {
      client.say(channel, "Invalid format. Usage: !addquote @username [quote text]");
      return;
    }

    const [_, username, quoteText] = match;

    if (!quoteText || quoteText.length > 500) {
      client.say(channel, "Quote text cannot be empty or exceed 500 characters.");
      return;
    }

    const newQuote = {
      quote: quoteText,
      author: username,
      timestamp: new Date().toISOString(),
      index: quotes.length + 1,
    };

    try {
      quotes.push(newQuote);
      fs.writeFileSync(config.quotesFile, JSON.stringify(quotes, null, 2)); // Save quotes
      client.say(
        channel,
        `Quote #${newQuote.index} added: "${newQuote.quote}" - ${newQuote.author}`
      );
    } catch (error) {
      console.error("Error saving the quote:", error);
      client.say(channel, "An error occurred while saving the quote. Please try again.");
    }
  },
};