const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.AI_MODEL || "openai/gpt-oss-120b";

/**
 * @param {string} systemPrompt
 * @param {{ role: "user" | "assistant", content: string }[]} history  newest message last
 * @returns {Promise<string>} the reply text, or "" if the AI returned nothing
 */
async function getReply(systemPrompt, history) {
    const completion = await groq.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...history],
        temperature: 0.7,
        max_tokens: 300,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
}

module.exports = { getReply };