const business = require("./business");
const { buildPrompt } = require("./prompt");
const { getReply } = require("./ai");
const { sendMessage, showTyping } = require("./whatsapp");
const memory = require("./memory");

const systemPrompt = buildPrompt(business); // built once at startup
let paused = false; // #pause / #resume (resets when the server restarts)

const digitsOnly = (value) => String(value || "").replace(/\D/g, "");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Short replies go out quickly, long replies take a bit longer.
function typingDelayMs(reply) {
    const { baseMs, perCharMs, maxMs, jitterMs } = business.delay;
    const byLength = Math.min(baseMs + reply.length * perCharMs, maxMs);
    const jitter = (Math.random() * 2 - 1) * jitterMs;
    return Math.max(0, byLength + jitter);
}

/** Handles ONE incoming WhatsApp message. Never throws. */
async function handleMessage(message) {
    try {
        const sender = message.from;

        // Images, voice notes etc. are ignored for now.
        if (message.type !== "text" || !message.text?.body?.trim()) return;
        const text = message.text.body.trim();

        // Admin commands: pause or resume the AI
        const admin = digitsOnly(process.env.ADMIN_WHATSAPP_NUMBER);
        if (admin && digitsOnly(sender) === admin) {
            const command = text.toLowerCase();

            if (command === "#pause") {
                paused = true;
                await sendMessage(sender, business.messages.paused);
                console.log("AI paused by admin.");
                return;
            }
            if (command === "#resume") {
                paused = false;
                await sendMessage(sender, business.messages.resumed);
                console.log("AI resumed by admin.");
                return;
            }
        }

        if (paused) {
            console.log("AI is paused. Skipping automatic reply.");
            return;
        }

        await showTyping(message.id);
        memory.add(sender, "user", text);

        const startedAt = Date.now();
        const reply = await getReply(systemPrompt, memory.get(sender));
        if (!reply) return;

        // Time the AI already took counts towards the delay.
        await sleep(typingDelayMs(reply) - (Date.now() - startedAt));

        await sendMessage(sender, reply);
        memory.add(sender, "assistant", reply);
    } catch (error) {
        console.error("Message handling failed:", error.message);
    }
}

module.exports = { handleMessage };