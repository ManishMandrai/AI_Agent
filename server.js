
require("dotenv").config();

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WhatsApp AI Agent backend is running!",
  });
});

// Meta webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    VERIFY_TOKEN &&
    token === VERIFY_TOKEN &&
    challenge
  ) {
    console.log("Webhook verified by Meta.");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});


app.get("/privacy", (req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy | ManishAI</title>
  <meta name="description" content="Privacy policy for the ManishAI WhatsApp AI Assistant." />
  <style>
    body {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      font: 16px/1.7 Arial, sans-serif;
      color: #222;
    }
    h1, h2 { line-height: 1.3; }
    a { color: #2563eb; }
    footer { margin-top: 40px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p><strong>Last updated:</strong> October 29, 2026</p>

  <p>This policy explains how ManishAI's WhatsApp AI Assistant
  handles information when you communicate with a business using
  the assistant.</p>

  <h2>1. Information We Process</h2>
  <p>Depending on your interaction, the service may process your
  WhatsApp phone number, message content, message identifiers,
  timestamps, and information you voluntarily provide, such as
  your name or enquiry details.</p>

  <h2>2. How We Use Information</h2>
  <p>Information is used to respond to enquiries, understand
  customer requests, help businesses manage leads, and maintain
  the reliability and security of the service.</p>

  <h2>3. WhatsApp and Service Providers</h2>
  <p>Messages are transmitted through Meta's WhatsApp services.
  The service is hosted by Render. If AI response generation is
  enabled, relevant message content may also be processed by the
  configured AI provider to generate a response. Those providers
  may process information under their own privacy policies.</p>

  <h2>4. Storage and Security</h2>
  <p>Information may be processed in application logs and other
  systems required to operate the service. We apply reasonable
  safeguards, but no internet-based service can guarantee absolute
  security. Information is retained only as needed for the
  service's purposes and applicable legal requirements.</p>

  <h2>5. Sharing</h2>
  <p>Information may be processed by service providers described
  above or disclosed when required by law. We do not sell personal
  information.</p>

  <h2>6. Your Choices and Requests</h2>
  <p>You may stop interacting with the assistant at any time.
  To ask questions about your personal information or request
  deletion, use our
  <a href="/data-deletion">data deletion instructions</a>.</p>

  <h2>7. Children's Privacy</h2>
  <p>This service is intended for general business communication
  and is not designed to knowingly collect personal information
  from children.</p>

  <h2>8. Changes to This Policy</h2>
  <p>This policy may be updated as the service develops. The
  latest version will be published on this page.</p>

  <h2>9. Contact</h2>
  <p>For privacy questions or requests, contact:
  <a href="mailto:Hello@manishai.xyz">Hello@manishai.xyz</a></p>

  <footer>ManishAI · Privacy Policy</footer>
</body>
</html>`);
});

app.get("/data-deletion", (req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Data Deletion | ManishAI</title>
  <style>
    body {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      font: 16px/1.7 Arial, sans-serif;
      color: #222;
    }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>Data Deletion Instructions</h1>
  <p>You can request deletion of personal information associated
  with your interactions with the ManishAI WhatsApp AI Assistant.</p>

  <h2>How to request deletion</h2>
  <ol>
    <li>Email Hello@manishai.xyz with the subject
    "Personal Data Deletion Request".</li>
    <li>Describe the interaction and provide the WhatsApp number
    associated with it, including the country code.</li>
    <li>We may request reasonable information to verify your
    identity before acting on the request.</li>
  </ol>

  <p>We will review your request and delete eligible information
  under our control, subject to applicable legal obligations.
  Some information may remain temporarily in backups or service
  logs until it expires under the relevant retention policies.</p>

  <p><a href="/privacy">Read our Privacy Policy</a></p>
</body>
</html>`);
});


// Receive WhatsApp events
app.post("/webhook", (req, res) => {
  // Acknowledge promptly so Meta doesn't keep retrying.
  res.sendStatus(200);

  const body = req.body;

  if (
    body.object !== "whatsapp_business_account" ||
    !Array.isArray(body.entry)
  ) {
    return;
  }

  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      const value = change.value;

      // Incoming messages
      for (const message of value.messages || []) {
        const sender = message.from;
        const type = message.type;

        const text =
          type === "text" ? message.text?.body : `[${type} message]`;

        console.log("Incoming WhatsApp message:", {
          sender,
          type,
          text,
          messageId: message.id,
        });
      }

      // Delivery/read status updates are not customer messages.
      for (const status of value.statuses || []) {
        console.log("WhatsApp status update:", {
          messageId: status.id,
          status: status.status,
        });
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
