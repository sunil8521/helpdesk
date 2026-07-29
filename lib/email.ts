import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("SMTP_USER and SMTP_PASS must be configured to send email.");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

export async function sendWorkspaceInviteEmail(input: {
  to: string; workspaceName: string; inviterName: string; role: "owner" | "admin" | "agent"; token: string;
}) {
  const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${encodeURIComponent(input.token)}`;
  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: input.to,
    subject: `${input.inviterName} invited you to ${input.workspaceName}`,
    text: `You have been invited to join ${input.workspaceName} as an ${input.role}. Accept your invitation here: ${inviteUrl}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 60px 20px; text-align: center;">
        <div style="max-width: 460px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #f3f4f6;">
          <h2 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Join ${input.workspaceName}</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 16px 0 32px;">
            <strong>${input.inviterName}</strong> invited you to join their team as an <strong>${input.role}</strong>. Click below to get started.
          </p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 28px; border-radius: 9px;">
            Accept Invitation
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 32px; line-height: 1.5; word-break: break-all;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #4f46e5; text-decoration: underline; margin-top: 8px; display: inline-block;">${inviteUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}
