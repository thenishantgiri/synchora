const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Synchora Team <onboarding@resend.dev>";

interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async ({ to, subject, html }: SendEmailPayload) => {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn("[email]", "Resend credentials missing. Skipping send.", {
      to,
      subject,
    });
    return { delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to send email (${response.status}): ${errorText || "Unknown error"}`
    );
  }

  return { delivered: true };
};

interface SendPasswordResetEmailArgs {
  to: string;
  name?: string | null;
  resetUrl: string;
}

export const sendPasswordResetEmail = ({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailArgs) => {
  return sendEmail({
    to,
    subject: "Reset your Synchora password",
    html: `
      <p>Hi${name ? ` ${name}` : ""},</p>
      <p>We received a request to reset your Synchora password. If you made this request, click the button below to choose a new password:</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#5C3B58;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Reset your password</a></p>
      <p>This link will expire in 30 minutes. If you didn’t request a password reset, you can safely ignore this email.</p>
      <p>Stay in sync,<br />Synchora team</p>
    `,
  });
};

interface SendEmailVerificationEmailArgs {
  to: string;
  code: string;
}

export const sendEmailVerificationEmail = ({
  to,
  code,
}: SendEmailVerificationEmailArgs) => {
  return sendEmail({
    to,
    subject: "Verify your Synchora email address",
    html: `
      <p>Welcome to Synchora!</p>
      <p>Your verification code is:</p>
      <p style="font-size:24px;font-weight:700;letter-spacing:6px;">${code}</p>
      <p>Enter this code in the app to finish creating your account. This code will expire in 10 minutes.</p>
      <p>If you didn’t request this code, you can safely ignore this email.</p>
    `,
  });
};
