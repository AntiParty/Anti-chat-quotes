const fs = require("fs");
const path = require("path");

module.exports = {
    name: "commands",
    description: "Display available commands",
    execute: (client, channel) => {
        const statusConfig = JSON.parse(fs.readFileSync("./src/status.json", "utf8"));

        if (!statusConfig.commands.commands) {
            client.say(channel, "❌ The 'commands' command is currently disabled.");
            return;
        }
        const commands = [];
        // Correct the path to the src/commands directory
        const commandsDir = path.resolve(__dirname);  // Resolving path from 'src/commands'
        const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js"));
        for (const file of commandFiles) {
            try {
                // Dynamically require the command using the absolute path
                const command = require(path.join(commandsDir, file));  // Correct path join
                if (!command.name || typeof command.name !== "string") {
                    continue;
                }
                commands.push(`!${command.name}`);
            } catch (error) {
                console.error(`❌ Error loading command "${file}":`, error.message);
            }
        }

        // Send all the commands at once to the channel
        if (commands.length > 0) {
            client.say(channel, `Available commands: ${commands.join(", ")}`);
        } else {
            client.say(channel, "No commands available.");
        }
    }
};
