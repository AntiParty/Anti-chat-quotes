const os = require("os");
const fs = require("fs");
const { execSync } = require("child_process");

module.exports = {
  name: "status",
  description: "Display system status",
  execute: (client, channel, config) => {
    // Load the configuration file
    const statusConfig = JSON.parse(fs.readFileSync("./src/status.json", "utf8"));
    const commandCountPath = "./commandCount.json"; // Direct path to the root directory file

    // Load command usage
    let commandUsage = { total: 0 };
    if (fs.existsSync(commandCountPath)) {
      try {
        commandUsage = JSON.parse(fs.readFileSync(commandCountPath, "utf8"));
      } catch (error) {
        console.error(`❌ Error reading commandCount file:`, error.message);
      }
    } else {
      fs.writeFileSync(commandCountPath, JSON.stringify(commandUsage, null, 2));
      console.log(`✔️  Initialized new command count file: "${commandCountPath}"`);
    }

    const totalCommands = commandUsage.total || 0;

    // Check if the command is enabled
    if (!statusConfig.commands.status) {
      client.say(channel, "❌ The 'status' command is currently disabled.");
      return;
    }

    try {
      const uptime = os.uptime();
      const uptimeDays = Math.floor(uptime / 86400);
      const uptimeHours = Math.floor((uptime % 86400) / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);

      const cpuModel = os.cpus()[0].model;
      const cpuUsage = execSync("top -bn1 | grep Cpu | awk '{print $2 + $4}'")
        .toString()
        .trim();

      const totalMem = Math.round(os.totalmem() / 1024 / 1024);
      const freeMem = Math.round(os.freemem() / 1024 / 1024);
      const usedMem = totalMem - freeMem;

      const osType = os.type();
      const osRelease = os.release();
      const loadAverage = os.loadavg().map(avg => avg.toFixed(2)).join(", ");

      const diskUsage = execSync("df -h / | tail -1 | awk '{print $3 \"/\" $2 \" (\" $5 \")\"}'")
        .toString()
        .trim();

      const statusMessage = `
        catnerd System Status:
        - Uptime: ${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m
        - OS: ${osType} ${osRelease}
        - CPU: ${cpuModel} (${cpuUsage}%)
        - Memory: ${usedMem}MB / ${totalMem}MB
        - Load Average: ${loadAverage}
        - Disk Usage: ${diskUsage}
        - Commands Executed: ${totalCommands}
      `;

      client.say(channel, statusMessage.trim());
    } catch (error) {
      console.error(`❌ Error retrieving system info:`, error.message);
      client.say(channel, "❌ Unable to retrieve system status.");
    }
  },
};
