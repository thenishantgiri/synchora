import { useConvexAuth, useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetChannelProps {
  id: Id<"channels">;
}

export const useGetChannel = ({ id }: UseGetChannelProps) => {
  const { isAuthenticated } = useConvexAuth();

  const data = useQuery(
    api.channels.getById,
    isAuthenticated ? { id } : "skip"
  );
  const isLoading = data === undefined;
  const isError = !isLoading && data === null;

  return { data, isLoading, isError };
};
