import { usePaginatedQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const BATCH_SIZE = 20;

interface UseGetMessagesProps {
  channelId?: Id<"channels">;
  parentMessageId?: Id<"messages">;
  conversationId?: Id<"conversations">;
  workspaceId: Id<"workspaces">;
}

export type GetMessageReturnType =
  (typeof api.messages.get._returnType)["page"];

export const useGetMessages = ({
  workspaceId,
  channelId,
  parentMessageId,
  conversationId,
}: UseGetMessagesProps) => {
  const { results, status, loadMore } = usePaginatedQuery(
    api.messages.get,
    { workspaceId, channelId, conversationId, parentMessageId },
    { initialNumItems: BATCH_SIZE }
  );

  return {
    results,
    status,
    loadMore: () => loadMore(BATCH_SIZE),
  };
};
