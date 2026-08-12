// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";
import { simpleParser } from "mailparser";

/** Decode RFC 2047 encoded-word (e.g. =?UTF-8?B?5rWL6K+V?= → 测试) */
function decodeRFC2047(input: string): string {
  if (!input) return input;
  return input.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, charset, enc, text) => {
    try {
      if (enc.toUpperCase() === "B") {
        return decodeURIComponent(escape(atob(text)));
      } else {
        return decodeURIComponent(escape(
          text.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
            String.fromCharCode(parseInt(hex, 16))
          )
        ));
      }
    } catch {
      return _;
    }
  });
}

/** Check if text looks like a raw RFC 5322 email (starts with headers) */
function looksLikeRawEmail(text: string): boolean {
  return /^(Received|Return-Path|ARC-|DKIM-|Authentication-Results|From|To|Subject|Date|MIME-Version|Content-Type):/im.test(text?.trim() || "");
}

async function parseRawEmail(raw: string) {
  try {
    const parsed = await simpleParser(raw);
    return {
      subject: decodeRFC2047(parsed.subject || "(无主题)"),
      text: parsed.text || "",
      html: parsed.html || parsed.textAsHtml || "",
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let to = "", from = "", subject = "", bodyText = "", bodyHtml = "";
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await request.json();
    to = json.to || json.recipient || ""; from = json.from || ""; subject = json.subject || "(无主题)"; bodyText = json.text || json["body-plain"] || ""; bodyHtml = json.html || json["body-html"] || "";
  } else {
    const fd = await request.formData();
    to = (fd.get("to") || fd.get("recipient") || "") as string; from = (fd.get("from") || "") as string;
    subject = (fd.get("subject") || "(无主题)") as string;
    bodyText = (fd.get("text") || fd.get("body-plain") || fd.get("stripped-text") || "") as string;
    bodyHtml = (fd.get("html") || fd.get("body-html") || fd.get("stripped-html") || "") as string;
  }
  if (!to) return NextResponse.json({ error: "缺少收件人" }, { status: 400 });

  const match = to.match(/<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/);
  const recipient = match ? match[1].toLowerCase() : to.toLowerCase();

  // If bodyText is a raw email, parse it with mailparser
  if (looksLikeRawEmail(bodyText)) {
    const parsed = await parseRawEmail(bodyText);
    if (parsed) {
      subject = parsed.subject || subject;
      bodyText = parsed.text;
      bodyHtml = parsed.html;
    }
  } else if (looksLikeRawEmail(bodyHtml)) {
    const parsed = await parseRawEmail(bodyHtml);
    if (parsed) {
      subject = parsed.subject || subject;
      bodyText = parsed.text;
      bodyHtml = parsed.html;
    }
  } else {
    // Still decode subject for non-raw emails
    subject = decodeRFC2047(subject);
  }

  const sb = getSupabase();
  const { data: mb } = await sb.from("mailboxes").select("id").eq("email", recipient).eq("is_active", true).single();
  if (!mb) return NextResponse.json({ received: false }, { status: 200 });

  await sb.from("emails").insert({
    mailbox_id: mb.id, from_address: from, to_address: recipient,
    subject, body_text: bodyText, body_html: bodyHtml
  });
  return NextResponse.json({ received: true });
}
