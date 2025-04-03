import { useQuery, useConvexAuth } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

interface UseGetWorkspaceProps {
  id: Id<"workspaces">;
}

export const useGetWorkspace = ({ id }: UseGetWorkspaceProps) => {
  const { isAuthenticated } = useConvexAuth();

  const data = useQuery(
    api.workspaces.getById,
    isAuthenticated ? { id } : "skip"
  );

  const isLoading = isAuthenticated && data === undefined;

  return { data, isLoading };
};
