const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

interface SendPasswordResetEmailArgs {
  to: string;
  name?: string | null;
  resetUrl: string;
}

export const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
}: SendPasswordResetEmailArgs) => {
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
    console.warn(
      "[password-reset]",
      "RESEND_API_KEY or RESEND_FROM_EMAIL not configured. Skipping email send.",
      { to, resetUrl }
    );
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
      subject: "Reset your Synchora password",
      html: `
        <p>Hi${name ? ` ${name}` : ""},</p>
        <p>We received a request to reset your Synchora password. If you made this request, click the button below to choose a new password:</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background-color:#5C3B58;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Reset your password</a></p>
        <p>This link will expire in 30 minutes. If you didn’t request a password reset, you can safely ignore this email.</p>
        <p>Stay in sync,<br />Synchora team</p>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to send password reset email (${response.status}): ${errorText}`
    );
  }

  return { delivered: true };
};
