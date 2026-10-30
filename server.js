require("dotenv").config(); // must stay first: other files read process.env

const express = require("express");
const business = require("./business");
const { handleMessage } = require("./bot");
const { privacyPage, termsPage, deletionPage } = require("./pages");

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

app.use(express.json());

// Pages are built once at startup from the business file
const privacyHtml = privacyPage(business);
const termsHtml = termsPage(business);
const deletionHtml = deletionPage(business);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WhatsApp AI Agent backend is running!",
  });
});

app.get("/privacy", (req, res) => res.type("html").send(privacyHtml));
app.get("/terms", (req, res) => res.type("html").send(termsHtml));
app.get("/data-deletion", (req, res) => res.type("html").send(deletionHtml));

// Meta webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && VERIFY_TOKEN && token === VERIFY_TOKEN && challenge) {
    console.log("Webhook verified by Meta.");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Receive WhatsApp events
app.post("/webhook", async (req, res) => {
  // Acknowledge promptly so Meta doesn't keep retrying.
  res.sendStatus(200);

  const body = req.body;

  if (body.object !== "whatsapp_business_account" || !Array.isArray(body.entry)) {
    return;
  }

  for (const entry of body.entry) {
    for (const change of entry.changes || []) {
      const value = change.value || {};

      for (const message of value.messages || []) {
        console.log("Incoming WhatsApp message:", {
          sender: message.from,
          type: message.type,
          text: message.type === "text" ? message.text?.body : `[${message.type} message]`,
          messageId: message.id,
        });

        await handleMessage(message);
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