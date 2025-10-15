import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../../convex/_generated/api";
import { sendPasswordResetEmail } from "@/lib/email";

const getConvexUrl = () =>
  process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const convexUrl = getConvexUrl();

    if (!convexUrl) {
      return NextResponse.json(
        { success: false, error: "Convex URL is not configured" },
        { status: 500 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);

    const { token, email: targetEmail, name } = await client.mutation(
      api.passwordReset.generateToken,
      { email }
    );

    if (token) {
      const resetUrl = `${getBaseUrl()}/auth/reset-password?token=${token}`;

      try {
        await sendPasswordResetEmail({
          to: targetEmail ?? email,
          name,
          resetUrl,
        });
      } catch (error) {
        console.error("[password-reset] Failed to send email", error);
        return NextResponse.json(
          {
            success: false,
            error: "We were unable to send the reset email. Try again later.",
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, you'll receive reset instructions shortly.",
    });
  } catch (error) {
    console.error("[password-reset] Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
