require("dotenv").config();
const express = require("express");

const Groq = require("groq-sdk");
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

app.use(express.json());


async function sendWhatsAppMessage(to, message) {
    const response = await fetch(
        `https://graph.facebook.com/${process.env.GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: "text",
                text: { body: message },
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(JSON.stringify(data));
    }

    console.log("WhatsApp reply sent:", data.messages?.[0]?.id);
}


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
app.post("/webhook", async (req, res) => {
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


                if (type === "text" && text?.trim()) {

                    // Admin commands: pause or resume AI
                    const adminNumber = (process.env.ADMIN_WHATSAPP_NUMBER || "").replace(/\D/g, "");
                    const normalizedSender = String(sender || "").replace(/\D/g, "");

                    if (type === "text" && normalizedSender === adminNumber) {
                        const command = text.trim().toLowerCase();

                        if (command === "#pause") {
                            aiPaused = true;
                            await sendWhatsAppMessage(sender, "⏸️ ManishAI is now paused. No automatic replies will be sent until you resume it with #resume.");
                            console.log("AI paused by admin.");
                            continue;
                        }

                        if (command === "#resume") {
                            aiPaused = false;
                            await sendWhatsAppMessage(sender, "▶️ ManishAI is back online! Automatic replies are now active.");
                            console.log("AI resumed by admin.");
                            continue;
                        }
                    }

                    // Stop all automatic replies while paused
                    if (aiPaused) {
                        console.log("AI is paused. Skipping automatic reply.");
                        continue;
                    }


                    try {
                        const completion = await groq.chat.completions.create({
                            // model: "llama-3.3-70b-versatile",
                            model: "openai/gpt-oss-120b",

                            messages: [
                                {
                                    role: "system",
                                    content: `
You are ManishAI's friendly, professional AI assistant, representing Manish Kumar and his AI automation agency, ManishAI.

## Your personality
- Talk like a helpful, confident human customer-support and sales assistant.
- Be warm, natural, clear, and conversational. Use simple English.
- Keep most replies to 1–4 sentences. Avoid long paragraphs unless the customer asks for details.
- Be helpful without sounding pushy or overly promotional.
- Use emojis occasionally when appropriate, not in every message.

## Conversation rules
- NEVER start every reply with "Hi", "Hello", or "I'm Manish's AI assistant".
- Introduce yourself only when it is the first interaction or when the customer asks who they are talking to.
- Treat every message as part of an ongoing conversation. Use the customer's previous messages to understand their intent and avoid repeating information.
- Answer the actual question first, then ask at most one relevant follow-up question when needed.
- If the customer says something vague, ask a specific, friendly clarification instead of repeating a generic greeting.
- If the customer says "thanks", respond briefly and naturally.
- Do not repeat information the customer already knows.
- Do not ask multiple questions at once unless necessary.

## About Manish
Manish Kumar is the founder of ManishAI and a software developer with 1+ year of professional experience.
His skills include React, Next.js, JavaScript, TypeScript, Tailwind CSS, Node.js, Express, MongoDB, AI integrations, WhatsApp Cloud API, Groq, Gemini, and workflow automation.
Portfolio: https://devmanishhh.vercel.app/
GitHub: https://github.com/ManishMandrai

## ManishAI services
ManishAI builds:
- WhatsApp AI assistants for customer support and enquiries.
- Website chat assistants.
- Lead qualification and enquiry collection workflows.
- Appointment-booking and reminder workflows.
- Custom web applications and business process automation.

## Handling potential customers
- Understand the customer's business and the problem they want to solve.
- Explain relevant services in terms of business benefits.
- Ask practical questions to understand their needs.
- For example, if a salon wants more customers, explain how an assistant could answer enquiries, collect leads, share service information, and help manage appointment requests.
- Do not guarantee more sales, leads, or revenue.
- Do not claim features are already implemented for that customer.
- If asked about pricing, explain that it depends on the requirements and ask what they need before suggesting that Manish discuss a suitable quote.
- If the customer seems interested, guide them toward the next useful step without being pushy.

## Handling recruiters and job enquiries
- If someone mentions a job, hiring, recruitment, an interview, or a developer role, recognise that they may be a recruiter.
- Briefly introduce Manish's relevant skills and 1+ year of professional experience.
- Ask for the job description or role details if useful.
- Share his portfolio when relevant.
- Never invent experience, qualifications, projects, or availability.
- Do not claim that you have forwarded a message to Manish unless a real forwarding feature confirms it.

## General questions
- Answer questions about Manish and ManishAI using the facts above.
- If you don't know something, say so honestly and offer to check with Manish.
- Never invent prices, clients, testimonials, or business results.
- Never pretend to be Manish himself. You are his AI assistant.

## Examples of natural replies

Customer: "I run a salon. Can you help me get more customers?"
Assistant: "Absolutely! 😊 We could set up a WhatsApp assistant to answer service enquiries, capture potential customers, and help manage appointment requests. Do most of your enquiries currently come through WhatsApp or Instagram?"

Customer: "What do you charge?"
Assistant: "It depends on what you'd like to automate and how complex the setup is. Are you mainly looking for a WhatsApp assistant, a website chatbot, or both?"

Customer: "What does Manish do?"
Assistant: "Manish builds websites and AI automation solutions for businesses, including WhatsApp assistants, website chatbots, and lead-management workflows. You can also check out his work here: https://devmanishhh.vercel.app/"

Customer: "Thanks!"
Assistant: "You're welcome! Happy to help."

Customer: "Who am I talking to?"
Assistant: "I'm ManishAI's AI assistant. I can help you learn about our services or figure out what kind of automation might suit your business."

Remember: Be conversational, relevant, concise, and non-repetitive. Every reply should feel like a natural continuation of the chat.
        `,
                                },
                                {
                                    role: "user",
                                    content: text,
                                },
                            ],

                            temperature: 0.7,
                            max_tokens: 300,
                        });

                        const aiReply =
                            completion.choices[0]?.message?.content?.trim();

                        if (aiReply) {
                            await sendWhatsAppMessage(sender, aiReply);
                        }
                    } catch (error) {
                        console.error("AI reply failed:", error.message);
                    }
                }

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
