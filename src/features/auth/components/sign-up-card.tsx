import { useMemo, useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { TriangleAlert } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { SignInFlow } from "../types";

interface SignUpCardProps {
  setState: (state: SignInFlow) => void;
}

export const SignUpCard = ({ setState }: SignUpCardProps) => {
  const { signIn } = useAuthActions();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);

  const resetVerificationState = () => {
    setCode("");
    setStep("form");
    setVerifyPending(false);
  };

  const onPasswordSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setPending(true);
    setError("");

    fetch("/api/email-verification/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to send verification code");
        }

        setStep("verify");
        toast.success("Verification code sent. Please check your email.");
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Unable to start verification";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setPending(false);
      });
  };

  const onProviderSignIn = (value: "github" | "google") => {
    setPending(true);
    signIn(value).finally(() => {
      setPending(false);
    });
  };

  const onVerifyCode = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setVerifyPending(true);
    setError("");

    fetch("/api/email-verification/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Invalid verification code");
        }

        return signIn("password", {
          name,
          email,
          phone,
          password,
          flow: "signUp",
        });
      })
      .then(() => {
        toast.success("Account created successfully");
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Verification failed";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setVerifyPending(false);
      });
  };

  const handleResend = () => {
    setPending(true);
    setError("");

    fetch("/api/email-verification/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error ?? "Failed to send verification code");
        }

        toast.success("Verification code resent");
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : "Unable to resend code";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setPending(false);
      });
  };

  return (
    <Card className="w-full h-full p-8">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Sign up to continue</CardTitle>
        <CardDescription>
          Use your email or another service to continue
        </CardDescription>
      </CardHeader>
      {!!error && (
        <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive mb-6">
          <TriangleAlert className="size-4" />
          <p>{error}</p>
        </div>
      )}
      <CardContent className="space-y-5 px-0 pb-0 ">
        {step === "form" ? (
          <form onSubmit={onPasswordSignUp} className="space-y-2.5">
            <Input
              disabled={pending}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
            <Input
              disabled={pending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              required
            />
            <Input
              disabled={pending}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              type="tel"
              required
            />
            <Input
              disabled={pending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              required
            />
            <Input
              disabled={pending}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              type="password"
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={pending}
            >
              Continue
            </Button>
          </form>
        ) : (
          <form onSubmit={onVerifyCode} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code we sent to <strong>{normalizedEmail}</strong>.
            </p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              disabled={verifyPending}
              required
            />
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={verifyPending || code.length !== 6}
            >
              Verify & Create account
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleResend}
                className="text-sky-700 hover:underline disabled:opacity-50"
                disabled={pending || verifyPending}
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={resetVerificationState}
                className="text-sky-700 hover:underline"
              >
                Change email
              </button>
            </div>
          </form>
        )}
        {step === "form" ? (
          <>
            <Separator />
            <div className="flex flex-col gap-y-2.5">
              <Button
                disabled={pending}
                onClick={() => onProviderSignIn("google")}
                variant={"outline"}
                size={"lg"}
                className="w-full relative"
              >
                <FcGoogle className="size-5 absolute left-2.5" />
                Continue with Google
              </Button>
              <Button
                disabled={pending}
                onClick={() => onProviderSignIn("github")}
                variant={"outline"}
                size={"lg"}
                className="w-full relative"
              >
                <FaGithub className="size-5 absolute left-2.5" />
                Continue with Github
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <span
                onClick={() => setState("signIn")}
                className="text-sky-700 hover:underline cursor-pointer"
              >
                Sign in
              </span>
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Already verified?{" "}
            <span
              onClick={() => setState("signIn")}
              className="text-sky-700 hover:underline cursor-pointer"
            >
              Sign in
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
