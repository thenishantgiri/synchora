import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../../../convex/_generated/api";

const getConvexUrl = () =>
  process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL ?? "";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;
    const code = body?.code;

    if (
      !email ||
      typeof email !== "string" ||
      !code ||
      typeof code !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "Email and code are required" },
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
    await client.mutation(api.emailVerification.verify, {
      email,
      code,
    });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("[email-verification] Verification failed", error);

    const message =
      error instanceof Error ? error.message : "Unable to verify email.";

    return NextResponse.json(
      { success: false, error: message },
      { status: 400 }
    );
  }
}
