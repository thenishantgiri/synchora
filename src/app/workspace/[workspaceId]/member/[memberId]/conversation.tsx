import { Loader } from "lucide-react";

import { useGetMember } from "@/features/members/api/use-get-member";
import { useGetMessages } from "@/features/messages/api/use-get-messages";

import { useMemberId } from "@/hooks/use-member-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { usePanel } from "@/hooks/use-panel";

import { MessageList } from "@/components/message-list";

import { Header } from "./header";
import { ChatInput } from "./chat-input";

import { Id } from "../../../../../../convex/_generated/dataModel";
import { on } from "events";

interface ConversationProps {
  id: Id<"conversations">;
}

export const Conversation = ({ id }: ConversationProps) => {
  const workspaceId = useWorkspaceId();
  const memberId = useMemberId();

  const { onOpenProfile } = usePanel();

  const { data: member, isLoading: isMemberLoading } = useGetMember({
    id: memberId,
  });
  const { results, status, loadMore } = useGetMessages({
    workspaceId,
    conversationId: id,
  });

  if (isMemberLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        memberName={member?.user.name}
        memberImage={member?.user.image}
        onClick={() => onOpenProfile(memberId)}
      />
      <MessageList
        data={results}
        variant={"conversation"}
        memberImage={member?.user.image}
        memberName={member?.user.name}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput
        placeholder={`Message ${member?.user.name || "Member"}`}
        conversationId={id}
      />
    </div>
  );
};
