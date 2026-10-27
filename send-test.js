
require("dotenv").config();

const axios = require("axios");

async function sendTestMessage() {
  const {
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_TEST_RECIPIENT,
    GRAPH_API_VERSION,
  } = process.env;

  if (
    !WHATSAPP_PHONE_NUMBER_ID ||
    !WHATSAPP_ACCESS_TOKEN ||
    !WHATSAPP_TEST_RECIPIENT ||
    !GRAPH_API_VERSION
  ) {
    throw new Error("Missing WhatsApp configuration in .env");
  }

  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/` +
    `${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const response = await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: WHATSAPP_TEST_RECIPIENT,
      type: "text",
      text: {
        body: "Hello! My new WhatsApp AI Agent backend is connected. 🚀",
      },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("Meta accepted the message request.");
  console.log(JSON.stringify(response.data, null, 2));
}

sendTestMessage().catch((error) => {
  console.error(
    "WhatsApp API error:",
    JSON.stringify(error.response?.data || error.message, null, 2)
  );
});
