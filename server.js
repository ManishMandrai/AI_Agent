
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
