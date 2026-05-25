import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const FROM_EMAIL = env.RESEND_FROM_EMAIL ?? "no-reply@example.com";

export async function sendEmail(args: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
}) {
  if (!resend) {
    console.warn("[resend] RESEND_API_KEY not set \u2014 skipping email", args.subject);
    return { skipped: true };
  }
  return resend.emails.send({
    from: FROM_EMAIL,
    to: args.to,
    subject: args.subject,
    react: args.react,
  });
}
