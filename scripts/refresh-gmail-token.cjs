/*
  Refresh Gmail OAuth2 access token using stored refresh token.
  - Reads GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GMAIL_REFRESH_TOKEN from .env.local
  - Calls https://oauth2.googleapis.com/token with grant_type=refresh_token
  - Merges and saves result to gmail.tokens.json (keeps existing refresh_token if none returned)
*/

const https = require("https");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;

if (!CLIENT_ID || !REFRESH_TOKEN) {
  console.error("Missing GOOGLE_CLIENT_ID or GMAIL_REFRESH_TOKEN in .env.local");
  process.exit(1);
}

function postForm(url, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      },
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const payload = {
      client_id: CLIENT_ID,
      refresh_token: REFRESH_TOKEN,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    };

    const tokenResp = await postForm("https://oauth2.googleapis.com/token", payload);

    if (!tokenResp || tokenResp.error || !tokenResp.access_token) {
      console.error("Token refresh failed:", tokenResp);
      process.exit(1);
    }

    const tokensPath = path.join(process.cwd(), "scripts", "gmail.tokens.json");

    let existing = {};

    try {
      existing = JSON.parse(fs.readFileSync(tokensPath, "utf8"));
    } catch {}

    const merged = {
      ...existing,
      ...tokenResp,
      refresh_token: tokenResp.refresh_token || existing.refresh_token || REFRESH_TOKEN,
    };

    fs.writeFileSync(tokensPath, JSON.stringify(merged, null, 2));
    console.log("Access token refreshed. Saved to:", tokensPath);
    console.log("Access token expires in (s):", merged.expires_in || "unknown");
  } catch (err) {
    console.error("Error refreshing token:", err);
    process.exit(1);
  }
})();
