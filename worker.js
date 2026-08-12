// Cloudflare Worker - Email forward to T6 Mail webhook
// Receives email from Cloudflare Email Routing, forwards to T6 Mail

export default {
  async email(message, env, ctx) {
    const webhookUrl = 'https://t6ios-mail.vercel.app/api/webhook/email';
    
    // Read the raw email content (message.raw is a ReadableStream)
    const rawEmail = await new Response(message.raw).text();
    
    const body = new URLSearchParams({
      to: message.to,
      from: message.from,
      subject: message.headers.get('subject') || '(无主题)',
      text: rawEmail,
      html: rawEmail,
    }).toString();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body,
      });
      
      console.log(`Email forwarded: ${message.to} ← ${message.from} [${response.status}]`);
    } catch (err) {
      console.error('Webhook error:', err.message);
    }
  }
};
