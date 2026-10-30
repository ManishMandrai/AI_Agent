function messagesUrl() {
    return `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

async function callWhatsApp(payload) {
    const response = await fetch(messagesUrl(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(JSON.stringify(data));
    }
    return data;
}

async function sendMessage(to, message) {
    const data = await callWhatsApp({
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: message },
    });
    console.log("WhatsApp reply sent:", data.messages?.[0]?.id);
}

// Shows "typing..." to the customer (also marks their message as read).
// It disappears when we send a reply, or after ~25 seconds.
// If it fails we only log it - the reply is still sent.
async function showTyping(messageId) {
    try {
        await callWhatsApp({
            status: "read",
            message_id: messageId,
            typing_indicator: { type: "text" },
        });
    } catch (error) {
        console.warn("Typing indicator failed:", error.message);
    }
}

module.exports = { sendMessage, showTyping };