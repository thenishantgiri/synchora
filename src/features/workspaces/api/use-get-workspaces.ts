import { useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";

export const useGetWorkspaces = () => {
  const data = useQuery(api.workspaces.get);
  const isLoading = data === undefined;
  const isError = !isLoading && data === null;

  return { data, isLoading, isError };
};
