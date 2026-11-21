# WhatsApp AI Agent

A Node.js backend that turns a WhatsApp Business number into an AI-powered customer-support and sales assistant. It receives customer messages through the **WhatsApp Business Cloud API**, generates replies with an LLM via **Groq**, and sends them back, with conversation memory, multilingual replies, and human-like typing behavior.

Everything about a business (identity, services, tone, example replies) lives in a single config file, so the same codebase can be reused for a new client without touching the core code.

---

## Features

- **WhatsApp Cloud API integration**: Meta webhook verification, incoming message handling, replies, and typing indicators.
- **LLM-powered replies**: uses Groq's API (default model: `openai/gpt-oss-120b`, configurable via env var).
- **Config-driven personas**: the system prompt is generated from a per-business file. Behavior rules are generic, business facts are swappable.
- **Multilingual**: replies in the customer's own language *and script*: English, Hindi (Devanagari), or Hinglish (Hindi in Roman letters). Switches if the customer switches.
- **Conversation memory**: per-customer history with a message cap and an inactivity TTL, plus periodic cleanup.
- **Human-like replies**: shows the WhatsApp "typing…" indicator and delays each reply based on its length (with jitter). Time already spent waiting on the LLM counts toward the delay.
- **Owner controls**: the admin number can send `#pause` / `#resume` over WhatsApp to turn automatic replies off or on.
- **Compliance pages**: serves `/privacy`, `/terms`, and `/data-deletion` pages (generated from the business file), which Meta requires when you take a WhatsApp app live.
- **Fast webhook acknowledgement**: responds `200` to Meta immediately and processes messages afterward, so Meta doesn't retry deliveries.

---

## How it works

```
Customer ──► WhatsApp ──► Meta Cloud API ──► POST /webhook (Express)
                                                   │
                                          handleMessage (bot.js)
                                     ┌─────────────┼───────────────┐
                                     ▼             ▼               ▼
                               memory.js       ai.js (Groq)    whatsapp.js
                           (per-customer     (system prompt   (typing indicator
                              history)        + history)       + send reply)
```

1. Meta sends a message event to `POST /webhook`; the server replies `200` right away.
2. `bot.js` ignores non-text messages, checks for admin commands, and respects the paused state.
3. The message is added to that customer's history, and the typing indicator is shown.
4. `ai.js` sends the system prompt plus recent history to Groq and gets a reply.
5. After a length-based delay, the reply is sent through the Graph API and saved to memory.

---

## Project structure

```
.
├── server.js          # Express app: webhook verification/receiver, legal pages, health check
├── bot.js             # Handles one incoming message: admin commands, memory, AI call, typing delay
├── ai.js              # Groq client: system prompt + history -> reply text
├── prompt.js          # Builds the system prompt from the business file
├── memory.js          # In-memory, per-customer chat history with TTL and cleanup
├── whatsapp.js        # Graph API helpers: send message, typing indicator
├── pages.js           # Generates privacy / terms / data-deletion HTML pages
├── send-test.js       # One-off script to verify your WhatsApp credentials work
└── business/
    ├── index.js       # Loads the business file named by the BUSINESS env var
    └── manishai.js    # Example business config (copy this for a new client)
```

---

## Prerequisites

- **Node.js 18+** (uses the built-in `fetch`; Express 5)
- A **Meta developer account** with a WhatsApp Business app set up (phone number ID + access token)
- A **Groq API key** ([console.groq.com](https://console.groq.com))
- A publicly reachable HTTPS URL for the webhook (a deployed server, or a tunnel such as ngrok while developing)

---

## Setup

```bash
git clone https://github.com/ManishMandrai/AI_Agent.git
cd AI_Agent
npm install
```

Create a `.env` file in the project root:

```env
# Server
PORT=3000
BUSINESS=manishai                  # loads business/manishai.js

# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=any_secret_string_you_choose
GRAPH_API_VERSION=v21.0            # use a current Graph API version
ADMIN_WHATSAPP_NUMBER=91XXXXXXXXXX # number allowed to send #pause / #resume

# AI
GROQ_API_KEY=your_groq_api_key
AI_MODEL=openai/gpt-oss-120b       # optional, this is the default

# Only needed for send-test.js
WHATSAPP_TEST_RECIPIENT=91XXXXXXXXXX
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Yes | Phone number ID from the Meta WhatsApp dashboard |
| `WHATSAPP_ACCESS_TOKEN` | Yes | Access token used to call the Graph API |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Yes | Secret string you choose; Meta sends it back during webhook verification |
| `GRAPH_API_VERSION` | Yes | Graph API version used in the request URL |
| `GROQ_API_KEY` | Yes | API key for Groq |
| `ADMIN_WHATSAPP_NUMBER` | No | Number that can send `#pause` / `#resume` (digits only) |
| `BUSINESS` | No | Name of the file in `business/` to load (default: `manishai`) |
| `AI_MODEL` | No | Groq model name (default: `openai/gpt-oss-120b`) |
| `PORT` | No | Server port (default: `3000`) |
| `WHATSAPP_TEST_RECIPIENT` | Only for `send-test.js` | Number that receives the test message |

---

## Running

```bash
npm start        # node server.js
npm run dev      # node --watch server.js (auto-restart on changes)
```

Check that it's up:

```bash
curl http://localhost:3000/
# {"success":true,"message":"WhatsApp AI Agent backend is running!"}
```

### Verify your WhatsApp credentials

```bash
node send-test.js
```

This sends a single test message to `WHATSAPP_TEST_RECIPIENT`, so you can confirm your token and phone number ID work before wiring up the webhook.

### Connect the webhook to Meta

1. Deploy the server (or expose it with a tunnel) so it has a public HTTPS URL.
2. In the Meta developer dashboard, open **WhatsApp → Configuration → Webhook**.
3. Set the callback URL to `https://your-domain/webhook` and the verify token to the value of `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
4. Subscribe to the **messages** field.
5. Send a message to your WhatsApp number. The bot should reply.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/webhook` | Meta webhook verification handshake |
| `POST` | `/webhook` | Receives WhatsApp messages and status updates |
| `GET` | `/privacy` | Privacy Policy page |
| `GET` | `/terms` | Terms of Service page |
| `GET` | `/data-deletion` | Data deletion instructions page |

---

## Admin commands

Send these from the number set in `ADMIN_WHATSAPP_NUMBER`:

| Command | Effect |
|---|---|
| `#pause` | Stops automatic replies to everyone |
| `#resume` | Turns automatic replies back on |

> The paused state is held in memory and resets to "active" when the server restarts.

---

## Customizing for a new business

All business-specific content lives in one file. To set up a new client:

1. Copy `business/manishai.js` to `business/yourclient.js`.
2. Edit it:
   - **Identity**: `name`, `owner`, `representing`
   - **Language**: default language and English style (`indian`, `uk`, or `us`)
   - **Knowledge**: `about` and `services`
   - **Scenarios**: rules for handling different kinds of people (for example, potential customers vs. recruiters)
   - **Examples**: sample replies that set the tone
   - **Memory**: `maxMessages` and `ttlHours`
   - **Reply delay**: `baseMs`, `perCharMs`, `maxMs`, `jitterMs`
   - **Legal pages**: contact email, hosting provider, governing law
3. Set `BUSINESS=yourclient` in `.env` and restart.

The reply delay is computed as `baseMs + (reply length × perCharMs)`, capped at `maxMs`, plus or minus `jitterMs`.

---

## Tech stack

- **Runtime:** Node.js
- **Server:** Express 5
- **AI:** Groq SDK (`groq-sdk`)
- **Messaging:** WhatsApp Business Cloud API (Meta Graph API)
- **Config:** `dotenv`
- **HTTP (test script):** `axios`

---

## Current limitations

- **Memory is in-RAM only.** Conversation history and the paused state are lost on restart. Use a database or Redis if you need persistence.
- **Text messages only.** Images, voice notes, and other media are ignored.
- **No webhook signature check.** Incoming requests are not verified against Meta's `X-Hub-Signature-256` header yet.
- **Single process.** In-memory state doesn't carry across multiple server instances.

## Roadmap ideas

- Persistent storage for chat history
- Webhook signature verification
- Handoff to a human agent
- Voice note and image support
- Appointment-booking and lead-capture flows

---

## Author

Built by **Manish Kumar** · [Portfolio](https://devmanishhh.vercel.app/) · [GitHub](https://github.com/ManishMandrai)
