const { memory: settings } = require("./business");

const maxMessages = settings.maxMessages;
const ttlMs = settings.ttlHours * 60 * 60 * 1000;

// customer number -> { messages: [{ role, content }], lastActive }
// Lives in RAM only: it is cleared whenever the server restarts.
const chats = new Map();

function add(customerId, role, content) {
    const now = Date.now();
    let chat = chats.get(customerId);

    if (!chat || now - chat.lastActive > ttlMs) {
        chat = { messages: [], lastActive: now };
        chats.set(customerId, chat);
    }

    chat.messages.push({ role, content });
    chat.lastActive = now;

    // Keep only the newest messages...
    if (chat.messages.length > maxMessages) {
        chat.messages.splice(0, chat.messages.length - maxMessages);
    }
    // ...and never start the history with an assistant message.
    while (chat.messages.length && chat.messages[0].role === "assistant") {
        chat.messages.shift();
    }
}

function get(customerId) {
    const chat = chats.get(customerId);
    if (!chat || Date.now() - chat.lastActive > ttlMs) return [];
    return [...chat.messages];
}

// Remove old chats every 30 minutes so memory never grows forever.
setInterval(() => {
    const now = Date.now();
    for (const [id, chat] of chats) {
        if (now - chat.lastActive > ttlMs) chats.delete(id);
    }
}, 30 * 60 * 1000).unref();

module.exports = { add, get };