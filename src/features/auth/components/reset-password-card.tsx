"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Loader2, TriangleAlert, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { api } from "../../../../convex/_generated/api";
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

interface ResetPasswordCardProps {
  token: string;
}

export const ResetPasswordCard = ({ token }: ResetPasswordCardProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = useQuery(
    api.passwordReset.tokenStatus,
    token ? { token } : "skip"
  );
  const resetPassword = useMutation(api.passwordReset.resetPassword);

  const canSubmit = useMemo(
    () =>
      status?.valid &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      password === confirmPassword &&
      !pending &&
      !completed,
    [status?.valid, password, confirmPassword, pending, completed]
  );

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!status?.valid) {
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      await resetPassword({ token, password });
      setCompleted(true);
      toast.success("Your password has been updated.");
    } catch (err) {
      console.error("[reset-password] Failed to reset password", err);
      const message =
        err instanceof Error ? err.message : "Unable to reset password.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0 space-y-2">
          <CardTitle>Reset link missing</CardTitle>
          <CardDescription>
            The reset link is invalid. Please request a new link.
          </CardDescription>
        </CardHeader>
        <CardFooter className="px-0 pt-6">
          <Link href="/auth/forgot-password" className="text-sky-700">
            Request a new link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (status === undefined) {
    return (
      <Card className="w-full h-full p-8 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (!status.valid) {
    const message =
      status.reason === "used"
        ? "This reset link has already been used."
        : status.reason === "expired"
          ? "This reset link has expired."
          : "This reset link is invalid.";

    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0 space-y-2">
          <CardTitle>Link unavailable</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter className="px-0 pt-6">
          <Link href="/auth/forgot-password" className="text-sky-700">
            Request a new reset link
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (completed) {
    return (
      <Card className="w-full h-full p-8">
        <CardHeader className="px-0 pt-0 space-y-2 flex items-start gap-3">
          <CheckCircle className="size-8 text-emerald-500 shrink-0" />
          <div>
            <CardTitle>Password updated</CardTitle>
            <CardDescription>
              Your password has been reset successfully. You can now sign in
              with your new credentials.
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className="px-0 pt-6">
          <Link href="/auth" className="text-sky-700">
            Return to sign in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full p-8">
      <CardHeader className="px-0 pt-0 space-y-2">
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>
          Your new password must be at least 8 characters long.
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
            disabled={pending}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            type="password"
            required
          />
          <Input
            disabled={pending}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            type="password"
            required
          />
          <Button type="submit" className="w-full" size="lg" disabled={!canSubmit}>
            {pending ? "Updating..." : "Update password"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="px-0 pt-6">
        <p className="text-xs text-muted-foreground">
          Changed your mind?{" "}
          <Link href="/auth" className="text-sky-700 hover:underline">
            Return to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};
