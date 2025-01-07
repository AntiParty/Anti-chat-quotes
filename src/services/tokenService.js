const axios = require("axios");
require("dotenv").config();

// Function to refresh the OAuth token
async function refreshOAuthToken() {
  try {
    const response = await axios.post(
      "https://id.twitch.tv/oauth2/token",
      null,
      {
        params: {
          grant_type: "refresh_token",
          refresh_token: process.env.TWITCH_LIVE_REFRESH_TOKEN,
          client_id: process.env.TWITCH_LIVE_CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
        },
      }
    );

    const newToken = response.data.access_token;
    const expiresIn = response.data.expires_in;
    const expirationTime = new Date(Date.now() + expiresIn * 1000);

    // Optionally save to a secure file or database
    process.env.TWITCH_OAUTH_TOKEN = newToken;

    console.log("OAuth token refreshed successfully.");
    console.log(`Token valid for ${expiresIn} seconds.`);
    console.log(`Token will expire at: ${expirationTime.toLocaleString()}`);

    return newToken;
  } catch (error) {
    console.error("Failed to refresh OAuth token:", error.response?.data || error.message);
    return null;
  }
}

// Helper to check and refresh the token if needed
async function getValidOAuthToken() {
  try {
    const response = await axios.get("https://id.twitch.tv/oauth2/validate", {
      headers: {
        Authorization: `OAuth ${process.env.TWITCH_OAUTH_TOKEN}`,
      },
    });

    console.log("Token is valid.");
    return process.env.TWITCH_OAUTH_TOKEN;
  } catch (error) {
    if (error.response?.status === 401) {
      console.warn("Token expired or invalid. Refreshing...");
      return await refreshOAuthToken();
    } else {
      console.error("Error validating token:", error.message);
      return null;
    }
  }
}

module.exports = {
  name: "tokenService",
  getValidOAuthToken,
  refreshOAuthToken,
};
