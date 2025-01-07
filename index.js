const tmi = require("tmi.js");
const fs = require("fs");
const { checkForChanges } = require("./src/services/auto-commit");
const { getValidOAuthToken } = require("./src/services/tokenService");
require("dotenv").config();

const statusConfig = JSON.parse(fs.readFileSync("./src/status.json", "utf8"));

// Load commands
const commands = {};
const commandFiles = fs.readdirSync("./src/commands").filter(file => file.endsWith(".js"));

console.log("\n=== Loading Commands ===");
for (const file of commandFiles) {
  try {
    const command = require(`./src/commands/${file}`);
    if (!command.name || typeof command.name !== "string") {
      console.warn(`⚠️  Skipped "${file}" (Invalid command name)`);
      continue;
    }
    commands[command.name] = command;
    console.log(`✔️  Loaded command: ${command.name}`);
  } catch (error) {
    console.error(`❌ Error loading command "${file}":`, error.message);
  }
}

const services = {};
const serviceFiles = fs.readdirSync("./src/services").filter(file => file.endsWith(".js"));

console.log("\n=== Loading Services ===");
for (const file of serviceFiles) {
  try {
    const service = require(`./src/services/${file}`);
    if (!service.name || typeof service.name !== "string") {
      console.warn(`⚠️  Skipped "${file}" (Invalid service name)`);
      continue;
    }
    services[service.name] = service;
    console.log(`✔️  Loaded service: ${service.name}`);
  } catch (error) {
    console.error(`❌ Error loading service "${file}":`, error.message);
  }
}

// Twitch bot configuration
const config = {
  username: process.env.TWITCH_USERNAME,
  password: process.env.TWITCH_OAUTH_TOKEN,
  channel: process.env.TWITCH_CHANNEL,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  quotesFile: "quotes.json",
  commandCount: "commandCount.json",
};

// Load existing quotes or initialize the JSON file
let quotes = [];
if (fs.existsSync(config.quotesFile)) {
  try {
    quotes = JSON.parse(fs.readFileSync(config.quotesFile, "utf8"));
    console.log(`✔️  Quotes loaded from "${config.quotesFile}"`);
  } catch (error) {
    console.error(`❌ Error reading quotes file:`, error.message);
    quotes = [];
  }
} else {
  fs.writeFileSync(config.quotesFile, JSON.stringify(quotes, null, 2));
  console.log(`✔️  Initialized new quotes file: "${config.quotesFile}"`);
}

let commandUsage = { total: 0 }; // Initialize with a total key
if (fs.existsSync(config.commandCount)) {
  try {
    commandUsage = JSON.parse(fs.readFileSync(config.commandCount, "utf8"));
    if (!commandUsage.total) commandUsage.total = 0; // Ensure total exists
    console.log(`✔️  Command usage loaded from "${config.commandCount}"`);
  } catch (error) {
    console.error(`❌ Error reading commandCount file:`, error.message);
    commandUsage = { total: 0 }; // Default structure
  }
} else {
  fs.writeFileSync(config.commandCount, JSON.stringify(commandUsage, null, 2));
  console.log(`✔️  Initialized new command count file: "${config.commandCount}"`);
}
const saveCommandUsage = () => {
  fs.writeFileSync(config.commandCount, JSON.stringify(commandUsage, null, 2));
};

// Create a Twitch client
const client = new tmi.Client({
  identity: {
    username: config.username,
    password: config.password,
  },
  channels: [config.channel],
});

// Connect to Twitch
client.connect();

client.on("message", (channel, userstate, message, self) => {
  if (self) return; // Ignore bot's own messages

  const args = message.split(" ");
  const commandName = args[0].slice(1).toLowerCase(); // Remove "!" prefix

  if (commands[commandName]) {
    if (!statusConfig.commands[commandName]) {
      client.say(channel, `NOPERS Command "${commandName}" is disabled.`);
      return;
    }
    try {
      // Track total command usage
      commandUsage.total += 1;
      commandUsage[commandName] = (commandUsage[commandName] || 0) + 1;
      saveCommandUsage();

      // Execute the command
      commands[commandName].execute(client, channel, userstate, args, quotes, config);
    } catch (error) {
      console.error(`❌ Error executing command "${commandName}":`, error.message);
      client.say(channel, `❌ Error executing command "${commandName}".`);
    }
  }
});

// Log connection details
client.on("connected", () => {
  console.log("\n=== Bot Connection Info ===");
  console.log(`✔️  Bot connected to irc-ws.chat.twitch.tv:443`);
  console.log(`✔️  Logged in as: ${config.username}`);
  console.log(`✔️  Monitoring channel: ${config.channel}`);
  console.log("=== Connection Successful ===\n");
});


// Run initial tasks
checkForChanges();