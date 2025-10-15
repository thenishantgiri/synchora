"use client";

import { useState } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const REQUEST_ENDPOINT = "/api/password-reset/request";

export const ForgotPasswordCard = () => {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(REQUEST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        const message =
          data?.error ??
          "We couldn't process your request right now. Please try again later.";
        setError(message);
        toast.error(message);
        return;
      }

      setSubmitted(true);
      toast.success(
        "If that email exists, you'll receive reset instructions shortly."
      );
    } catch (err) {
      console.error("[forgot-password] request failed", err);
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full h-full p-8">
      <CardHeader className="px-0 pt-0 space-y-2">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter the email address associated with your account and we&apos;ll
          send you a reset link.
        </CardDescription>
      </CardHeader>
      {error && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive mb-6">
          <TriangleAlert className="size-4" />
          <p>{error}</p>
        </div>
      )}
      <CardContent className="space-y-5 px-0 pb-0">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            disabled={pending || submitted}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            type="email"
            required
            autoFocus
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={pending || submitted}
          >
            {submitted ? "Email sent" : "Send reset link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="mt-5 px-0">
        <p className="text-xs text-muted-foreground">
          Remembered your password?{" "}
          <Link href="/auth" className="text-sky-700 hover:underline">
            Return to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
