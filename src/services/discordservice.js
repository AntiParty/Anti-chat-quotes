const axios = require("axios");
const { getValidOAuthToken } = require("./tokenService");

function isServiceEnabled(serviceName) {
  const statusConfig = JSON.parse(fs.readFileSync("./src/status.json", "utf8"));
  return statusConfig.services[serviceName];
} 

async function sendDiscordNotification(stream, webhookUrl) {
  if (!isServiceEnabled("discordservice")) {
    console.log("Discord service is disabled.");
    return;
  }

  const embed = {
    title: `Now Live: ${stream.title}`,
    description: stream.description,
    color: 5814783,
    timestamp: new Date(),
    url: `https://www.twitch.tv/${stream.user_name}`,
    thumbnail: {
      url: stream.thumbnail_url.replace("{width}", "640").replace("{height}", "360"),
    },
    footer: {
      text: "Antiparty's bot",
    },
  };

  try {
    await axios.post(webhookUrl, {
      content: `**${stream.user_name} is live now!**`,
      embeds: [embed],
    });
  } catch (error) {
    console.error("Error sending Discord notification:", error);
  }
}

async function sendTestDiscordNotification(webhookUrl, config) {
  try {
    const validToken = await getValidOAuthToken();
    if (!validToken) {
      console.error("Unable to fetch a valid token.");
      return;
    }

    const response = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": process.env.CLIENT_ID,
        Authorization: `Bearer ${validToken}`,
      },
      params: { login: "antiparty" },
    });

    const user = response.data.data[0];
    if (!user) {
      console.error("Error: Channel information not found.");
      return;
    }

    const embed = {
      title: `Test: ${user.display_name}`,
      description: `This is a test notification for ${user.display_name}.`,
      color: 5814783,
      timestamp: new Date(),
      url: `https://www.twitch.tv/${user.login}`,
      thumbnail: { url: user.offline_image_url },
      footer: { text: "Antiparty's bot Test" },
    };

    await axios.post(webhookUrl, {
      content: `**Test notification for ${user.display_name}**`,
      embeds: [embed],
    });

    console.log("Test embed sent successfully!");
  } catch (error) {
    console.error("Error sending test Discord embed:", error);
  }
}

module.exports = {
  name: "discordService",
  sendDiscordNotification,
  sendTestDiscordNotification,
};
