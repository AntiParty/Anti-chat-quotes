const fs = require("fs");
const { exec } = require("child_process");

// Define the file path and commit message
const quotesFile = "./quotes.json";
const commitMessage = 'Auto-commit updated quotes.json';

let lastModifiedTime = Date.now();

// Commit and push the changes
const commitAndPush = () => {
    // First pull the remote changes to avoid conflicts
    exec('git pull origin main --rebase', { env: { ...process.env, GIT_ASKPASS: "echo", GIT_PASSWORD: process.env.GITHUB_TOKEN } }, (pullError, pullStdout, pullStderr) => {
        if (pullError) {
            console.error(`Error pulling changes: ${pullError.message}`);
            return;
        }
        console.log(`Git pull output:\n${pullStdout}`);
        if (pullStderr) {
            console.error(`Git pull errors:\n${pullStderr}`);
        }

        // Once pull is successful, commit and push the changes
        exec(`git add ${quotesFile} && git commit -m "${commitMessage}" && git push origin main`, 
            { env: { ...process.env, GIT_ASKPASS: "echo", GIT_PASSWORD: process.env.GITHUB_TOKEN } }, // Ensure personal access token is used
            (commitError, commitStdout, commitStderr) => {
                if (commitError) {
                    console.error(`Error committing and pushing changes: ${commitError.message}`);
                    return;
                }
                console.log(`Git output:\n${commitStdout}`);
                if (commitStderr) {
                    console.error(`Git errors:\n${commitStderr}`);
                }
                console.log(`Changes committed and pushed successfully to https://github.com/AntiParty/Anti-chat-quotes`);
            }
        );
    });
};

// Check for changes in the file and commit/push if changes are detected
const checkForChanges = () => {
    fs.stat(quotesFile, (err, stats) => {
        if (err) {
            console.error(`Error reading file stats: ${err.message}`);
            return;
        }

        if (stats.mtimeMs > lastModifiedTime) {
            lastModifiedTime = stats.mtimeMs;
            console.log(`Detected changes in ${quotesFile}, committing and pushing...`);
            commitAndPush();
        }
    });
};

// Check for changes every 5 minutes
setInterval(checkForChanges, 5 * 60 * 1000); // Every 5 minutes

module.exports = { name: "auto-commit", checkForChanges, commitAndPush };
