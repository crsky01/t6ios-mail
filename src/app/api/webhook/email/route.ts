// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/db";

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

  const sb = getSupabase();
  const { data: mb } = await sb.from("mailboxes").select("id").eq("email", recipient).eq("is_active", true).single();
  if (!mb) return NextResponse.json({ received: false }, { status: 200 });

  await sb.from("emails").insert({
    mailbox_id: mb.id, from_address: from, to_address: recipient,
    subject, body_text: bodyText, body_html: bodyHtml
  });
  return NextResponse.json({ received: true });
}
