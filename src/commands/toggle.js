const fs = require("fs");

module.exports = {
  name: "toggle",
  description: "Toggle a command or service on/off",
  execute: (client, channel, userstate, args) => {
    if (args.length < 3) {
      client.say(channel, "Usage: !toggle <command|service> <name> <on|off>");
      return;
    }
    const isMod = userstate.mod || userstate["user-type"] === "mod" || userstate.badges?.broadcaster;
    if (!isMod) {
      client.say(channel, "You don't have permission to use this command.");
      return;
    }
    const [type, name, state] = args.slice(1);
    if (!["command", "service"].includes(type) || !["on", "off"].includes(state)) {
      client.say(channel, "Invalid arguments. Usage: !toggle <command|service> <name> <on|off>");
      return;
    }

    const statusConfig = JSON.parse(fs.readFileSync("./src/status.json", "utf8"));
    const statusType = type === "command" ? statusConfig.commands : statusConfig.services;

    if (!(name in statusType)) {
      client.say(channel, `❌ ${type} "${name}" not found.`);
      return;
    }

    statusType[name] = state === "on";
    fs.writeFileSync("./src/status.json", JSON.stringify(statusConfig, null, 2));
    client.say(channel, `✔️ ${type} "${name}" has been turned ${state}.`);
  },
};