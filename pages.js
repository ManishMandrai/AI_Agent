// Builds the Privacy Policy, Terms of Service and Data Deletion pages
// from the business file.

const esc = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

function page(title, body, description) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>${description ? `\n  <meta name="description" content="${esc(description)}" />` : ""
        }
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
${body}
</body>
</html>`;
}

function privacyPage(b) {
    const name = esc(b.name);
    const email = esc(b.contactEmail);

    return page(
        `Privacy Policy | ${b.name}`,
        `  <h1>Privacy Policy</h1>
  <p><strong>Last updated:</strong> ${esc(b.legal.lastUpdated)}</p>

  <p>This policy explains how ${name}'s WhatsApp AI Assistant
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
  The service is hosted by ${esc(b.hostingProvider)}. If AI response generation is
  enabled, relevant message content may also be processed by the
  configured AI provider to generate a response. Those providers
  may process information under their own privacy policies.</p>

  <h2>4. Storage and Security</h2>
  <p>Information may be processed in application logs and other
  systems required to operate the service. Recent messages from a
  conversation are also held temporarily in the service's memory
  (for up to ${esc(b.memory.ttlHours)} hours) so the assistant can follow the
  conversation; this memory is cleared when the service restarts.
  We apply reasonable safeguards, but no internet-based service can
  guarantee absolute security. Information is retained only as needed
  for the service's purposes and applicable legal requirements.</p>

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
  <a href="mailto:${email}">${email}</a></p>

  <footer>${name} · Privacy Policy</footer>`,
        `Privacy policy for the ${b.name} WhatsApp AI Assistant.`
    );
}

function termsPage(b) {
    const name = esc(b.name);
    const owner = esc(b.owner);
    const email = esc(b.contactEmail);

    return page(
        `Terms of Service | ${b.name}`,
        `  <h1>Terms of Service</h1>
  <p><strong>Last updated:</strong> ${esc(b.legal.lastUpdated)}</p>

  <p>These terms apply when you use the ${name} WhatsApp AI
  Assistant (the "Service").</p>

  <h2>1. About the Service</h2>
  <p>The Service uses artificial intelligence to answer enquiries
  and provide information about ${name} and its services over
  WhatsApp.</p>

  <h2>2. Acceptance of These Terms</h2>
  <p>By sending a message to the Service you agree to these terms.
  If you do not agree, please stop using the Service.</p>

  <h2>3. AI-Generated Responses</h2>
  <p>Replies are generated automatically and may be incomplete or
  inaccurate. They are not professional, legal, financial or medical
  advice. Prices, availability and any commitments are only confirmed
  when ${owner} or ${name} confirms them directly.</p>

  <h2>4. No Guarantees</h2>
  <p>The Service is provided "as is". We do not guarantee that it
  will always be available, uninterrupted or error-free.</p>

  <h2>5. Acceptable Use</h2>
  <p>Do not use the Service for anything unlawful, abusive or
  harassing, and do not try to disrupt or misuse it. Please do not
  share sensitive information such as passwords, card numbers or
  government ID numbers in the chat.</p>

  <h2>6. Third-Party Services</h2>
  <p>The Service runs on WhatsApp, so Meta's terms and policies also
  apply to your use of WhatsApp. Messages may also be processed by
  the third-party providers described in our
  <a href="/privacy">Privacy Policy</a>.</p>

  <h2>7. Limitation of Liability</h2>
  <p>To the extent permitted by law, ${name} is not liable for
  indirect or consequential losses arising from your use of, or
  reliance on, the Service or its responses.</p>

  <h2>8. Changes to These Terms</h2>
  <p>We may update these terms from time to time. The latest version
  will be published on this page.</p>

  <h2>9. Governing Law</h2>
  <p>These terms are governed by the laws of ${esc(b.legal.governingLaw)}.</p>

  <h2>10. Contact</h2>
  <p>Questions about these terms:
  <a href="mailto:${email}">${email}</a></p>

  <footer>${name} · Terms of Service</footer>`,
        `Terms of service for the ${b.name} WhatsApp AI Assistant.`
    );
}

function deletionPage(b) {
    const email = esc(b.contactEmail);

    return page(
        `Data Deletion | ${b.name}`,
        `  <h1>Data Deletion Instructions</h1>
  <p>You can request deletion of personal information associated
  with your interactions with the ${esc(b.name)} WhatsApp AI Assistant.</p>

  <h2>How to request deletion</h2>
  <ol>
    <li>Email ${email} with the subject
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

  <p><a href="/privacy">Read our Privacy Policy</a></p>`
    );
}

module.exports = { privacyPage, termsPage, deletionPage };