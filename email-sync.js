// email-sync.js — 本地运行，每30秒检查Gmail并同步到T6 Mail
// 用法: node email-sync.js
// 需要: npm install imap mailparser (自动安装)

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const https = require('https');
const http = require('http');

const CONFIG = {
  gmail: {
    user: 'xiexienixie8@gmail.com',
    // 去 https://myaccount.google.com/apppasswords 生成应用专用密码
    password: 'YOUR_APP_PASSWORD',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
  },
  webhook: 'https://t6ios-mail.vercel.app/api/webhook/email',
  checkInterval: 30000, // 30秒
  domain: 't6ios.com',
};

function postEmail(email) {
  const data = new URLSearchParams({
    to: email.to,
    from: email.from,
    subject: email.subject || '(无主题)',
    text: email.text || '',
    html: email.html || '',
  }).toString();

  const url = new URL(CONFIG.webhook);
  const mod = url.protocol === 'https:' ? https : http;
  const req = mod.request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }, (res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ✅ ${email.to} ← ${email.from}: ${email.subject}`);
  });
  req.on('error', (e) => console.error('Webhook error:', e.message));
  req.write(data);
  req.end();
}

function checkInbox() {
  const imap = new Imap(CONFIG.gmail);

  imap.once('ready', () => {
    imap.openBox('INBOX', false, () => {
      // Search for unread emails to @t6ios.com
      imap.search(['UNSEEN', ['TO', CONFIG.domain]], (err, results) => {
        if (err || !results?.length) {
          imap.end();
          return;
        }

        const fetch = imap.fetch(results, { bodies: '' });
        fetch.on('message', (msg) => {
          let buffer = '';
          msg.on('body', (stream) => {
            stream.on('data', (chunk) => { buffer += chunk.toString('utf8'); });
          });
          msg.once('end', () => {
            simpleParser(buffer, (err, parsed) => {
              if (!err && parsed) {
                postEmail({
                  to: parsed.to?.text || '',
                  from: parsed.from?.text || '',
                  subject: parsed.subject || '',
                  text: parsed.text || '',
                  html: parsed.html || '',
                });
              }
            });
          });
        });

        fetch.once('end', () => {
          imap.end();
        });
      });
    });
  });

  imap.once('error', (err) => console.error('IMAP error:', err.message));
  imap.connect();
}

console.log('🚀 T6 Mail Email Sync 启动...');
console.log(`⏱  每 ${CONFIG.checkInterval / 1000} 秒检查一次`);
console.log('📧 同步 Gmail → T6 Mail Webhook');
console.log('');
checkInbox();
setInterval(checkInbox, CONFIG.checkInterval);
