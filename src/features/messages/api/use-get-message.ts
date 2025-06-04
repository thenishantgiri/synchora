import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetMessageProps {
  id: Id<"messages">;
}

export const useGetMessage = ({ id }: UseGetMessageProps) => {
  const data = useQuery(api.messages.getById, { id });
  const [error, setError] = useState<Error | null>(null);

  const isLoading = data === undefined;
  const isError = !isLoading && data === null;

  useEffect(() => {
    if (isError) {
      const err = new Error("Message not found or access denied.");
      setError(err);
      toast.error(err.message);
    }
  }, [isError]);

  return {
    data,
    error,
    isLoading,
    isError,
  };
};
