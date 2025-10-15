import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../../convex/_generated/api";
import { sendEmailVerificationEmail } from "@/lib/email";

const getConvexUrl = () =>
  process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

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
    const result = await client.mutation(api.emailVerification.request, {
      email,
    });

    try {
      await sendEmailVerificationEmail({
        to: result.email,
        code: result.code,
      });
    } catch (error) {
      console.error("[email-verification] Failed to send email", error);
      return NextResponse.json(
        {
          success: false,
          error:
            "We were unable to send the verification email. Please try again later.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent. Please check your email.",
    });
  } catch (error) {
    console.error("[email-verification] Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Something went wrong. Please try again later.",
      },
      { status: 500 }
    );
  }
}
