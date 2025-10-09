/*
  Temporary script to obtain Gmail OAuth2 tokens for IMAP (XOAUTH2).
  - Reads GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, optional GOOGLE_REDIRECT_URI from .env.local
  - Default redirect: http://localhost:3000/oauth2callback (must be authorized in Google Console)
  - Scope: https://mail.google.com/
  - Saves tokens to gmail.tokens.json in project root
*/

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { google } = require("googleapis");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local");
  process.exit(1);
}

const SCOPE = ["https://mail.google.com/"]; // full Gmail/IMAP scope for XOAUTH2
const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // ensures refresh_token on first consent
  prompt: "consent", // force refresh_token even if user already consented
  scope: SCOPE,
});

const redirectUrl = new URL(REDIRECT_URI);
const listenPort = Number(redirectUrl.port || (redirectUrl.protocol === "https:" ? 443 : 3000));
const listenPathname = redirectUrl.pathname || "/oauth2callback";

console.log("\n1) Open this URL to authorize:");
console.log(authUrl);
console.log("\n2) After consenting, you will be redirected and this script will capture the code.");
console.log(`Listening on http://localhost:${listenPort}${listenPathname} ...\n`);

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url, `http://localhost:${listenPort}`);
    if (req.method === "GET" && reqUrl.pathname === listenPathname) {
      const code = reqUrl.searchParams.get("code");
      if (!code) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Missing ?code parameter");
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<html><body>Authorization received. You can close this window.</body></html>");

      server.close();

      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);

      const tokensPath = path.join(process.cwd(), "scripts", "gmail.tokens.json");
      fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
      console.log("\nTokens saved to:", tokensPath);
      if (tokens.refresh_token) {
        console.log("Refresh token obtained. Keep it secure.");
      } else {
        console.warn(
          "No refresh_token returned. Ensure you used access_type=offline & prompt=consent and first-time consent.",
        );
      }
      console.log("Access token:", tokens.access_token ? "received" : "not present");
      process.exit(0);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  } catch (err) {
    console.error("Error handling callback:", err);
    try {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } catch {}
    process.exit(1);
  }
});

server.listen(listenPort, () => {
  // server ready
});
