const fs = require("fs");
const { parse } = require("chrono-node");

const remindersFile = "reminders.json";

// Load existing reminders or initialize if the file doesn't exist
let reminders = [];
if (fs.existsSync(remindersFile)) {
  reminders = JSON.parse(fs.readFileSync(remindersFile, "utf8"));
} else {
  fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
}

module.exports = {
  name: "remindme",
  description: "Set a reminder. Usage: !remindme [time] [message]",
  execute: (client, channel, userstate, message) => {
    const statusConfig = JSON.parse(fs.readFileSync("./src/status.json", "utf8"));

    if (!statusConfig.commands.remindme) {
      client.say(channel, "❌ The 'remindme' command is currently disabled.");
      return;
    }
    
    if (Array.isArray(message)) {
      message = message.join(" "); // Join the array elements into a single string
    }

    if (typeof message !== "string") {
      client.say(channel, "❌ Invalid message format.");
      return;
    }

    // Trim the message and remove "!remindme"
    const args = message.slice(9).trim(); // Remove "!remindme " from the message
    //console.log("Trimmed args:", args); // Log the trimmed arguments

    if (!args) {
      client.say(channel, "❌ Usage: !remindme [time] [message]");
      return;
    }

    // Split the input into time and message (first word is time, rest is message)
    const argsArray = args.split(" "); // Split by space to get the time and the message
    const time = argsArray[0]; // First part is the time
    const reminderText = argsArray.slice(1).join(" "); // The rest is the reminder message

    // Debugging: Log parsed time and reminder text
    //console.log("Parsed time:", time);
    //console.log("Reminder text:", reminderText);

    // Convert the time to milliseconds
    let delay = 0;

    // Handle time formats
    if (time.match(/^(\d+)s$/)) {
      delay = parseInt(time) * 1000; // Seconds to milliseconds
    } else if (time.match(/^(\d+)m$/)) {
      delay = parseInt(time) * 60 * 1000; // Minutes to milliseconds
    } else if (time.match(/^(\d+)h$/)) {
      delay = parseInt(time) * 60 * 60 * 1000; // Hours to milliseconds
    } else {
      // If the time format is not simple, attempt to parse it with chrono-node
      const parsedTime = parse(time);
      //console.log("Parsed time with chrono-node:", parsedTime); // Debug chrono-node parsing
      if (parsedTime && parsedTime.length > 0) {
        const reminderTime = new Date(parsedTime[0].start.date());
        delay = reminderTime.getTime() - new Date().getTime();
      }
    }

    // Handle case where time is invalid or in the past
    if (delay <= 0) {
      client.say(channel, "❌ The reminder time must be in the future.");
      return;
    }

    // Add reminder to the array and save to JSON
    const newReminder = {
      username: userstate.username,
      reminderText: reminderText,
      reminderTime: new Date(Date.now() + delay),
    };

    // Log the reminder that is being added
    //console.log("Adding new reminder:", newReminder);

    reminders.push(newReminder);

    // Write reminders to JSON file
    try {
      fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
      //console.log("Reminders saved to JSON file.");
    } catch (error) {
      console.error("Error writing to JSON file:", error);
    }

    // Set a timeout to send the reminder after the specified delay
    setTimeout(() => {
      client.say(channel, `LOCKIN Reminder for @${newReminder.username}: ${newReminder.reminderText}`);
      // Remove the reminder after sending
      reminders = reminders.filter((reminder) => reminder !== newReminder);
      try {
        fs.writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));
        //console.log("Reminders updated after sending reminder.");
      } catch (error) {
        //console.error("Error writing to JSON file after reminder:", error);
      }
    }, delay);

    // Let the user know their reminder has been set
    client.say(channel, `handshake Reminder set for @${userstate.username}! I will remind you in ${time}.`);
  },
};