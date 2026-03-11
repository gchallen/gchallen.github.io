import nodemailer from "nodemailer"
import { getDb } from "./mongodb"

const SITE_URL = process.env.SITE_URL || "https://geoffreychallen.com"
const FROM_EMAIL = process.env.FROM_EMAIL || '"Geoffrey Challen" <geoffrey.challen@gmail.com>'

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "outbound-relays.techservices.illinois.edu",
  port: parseInt(process.env.SMTP_PORT || "25"),
  secure: false,
  tls: { rejectUnauthorized: false },
})

let smtpAvailable = process.env.NODE_ENV === "production"

// Probe SMTP on startup in development
if (process.env.NODE_ENV !== "production") {
  mailer
    .verify()
    .then(() => {
      smtpAvailable = true
      console.log("SMTP server reachable — email enabled")
    })
    .catch(() => {
      console.log("SMTP server not reachable — email disabled")
    })
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text: string
  type: string
}

async function sendEmail(options: SendEmailOptions): Promise<void> {
  const { to, subject, html, text, type } = options
  const db = await getDb()

  await db.collection("emails").insertOne({
    recipient: to,
    subject,
    body: html,
    type,
    timestamp: new Date(),
  })

  if (!smtpAvailable) {
    console.log(`[DEV] Would send email to ${to}: ${subject}`)
    return
  }

  await mailer.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
  })
}

export async function sendConfirmationEmail(email: string, token: string): Promise<void> {
  const confirmUrl = `${SITE_URL}/api/subscribe/confirm?token=${token}`
  await sendEmail({
    to: email,
    subject: "Confirm your subscription to geoffreychallen.com",
    html: `<p>Thanks for subscribing! Please confirm your email by clicking the link below:</p>
<p><a href="${confirmUrl}">Confirm subscription</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
    text: `Thanks for subscribing! Please confirm your email by visiting:\n\n${confirmUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
    type: "confirmation",
  })
}

export function buildNotificationEmail(
  essay: { title: string; description: string; url: string },
  unsubscribeToken: string,
): { subject: string; html: string; text: string } {
  const essayUrl = `${SITE_URL}/${essay.url}`
  const unsubscribeUrl = `${SITE_URL}/api/subscribe/unsubscribe?token=${unsubscribeToken}`
  return {
    subject: `New essay: ${essay.title}`,
    html: `<p>I just published a new essay: <a href="${essayUrl}">${essay.title}</a></p>
<p>${essay.description}</p>
<p><a href="${essayUrl}">Read it here</a></p>
<hr>
<p style="font-size: 0.85em; color: #666;"><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
    text: `I just published a new essay: ${essay.title}\n\n${essay.description}\n\nRead it here: ${essayUrl}\n\n---\nUnsubscribe: ${unsubscribeUrl}`,
  }
}

export async function sendNotificationEmail(
  email: string,
  essay: { title: string; description: string; url: string },
  unsubscribeToken: string,
): Promise<void> {
  const { subject, html, text } = buildNotificationEmail(essay, unsubscribeToken)
  await sendEmail({
    to: email,
    subject,
    html,
    text,
    type: "notification",
  })
}
