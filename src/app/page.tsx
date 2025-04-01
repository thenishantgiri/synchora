"use client";

import { Button } from "@/components/ui/button";
import { useAuthActions } from "@convex-dev/auth/react";

export default function Home() {
  const { signOut } = useAuthActions();

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div>
      <h1>Logged In</h1>
      <Button onClick={handleSignOut}>Sign Out</Button>
    </div>
  );
}
