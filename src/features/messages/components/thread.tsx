import { AlertTriangle, Loader, XIcon } from "lucide-react";
import { useState } from "react";

import { useWorkspaceId } from "@/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import { Message } from "@/components/message";

import { useCurrentMember } from "@/features/members/api/use-current-members";
import { useGetMessage } from "@/features/messages/api/use-get-message";

import { Id } from "../../../../convex/_generated/dataModel";

interface ThreadProps {
  messageId: Id<"messages">;
  onClose: () => void;
}

export const Thread = ({ messageId, onClose }: ThreadProps) => {
  const workspaceId = useWorkspaceId();

  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { data: message, isLoading: isMessageLoading } = useGetMessage({
    id: messageId,
  });

  if (isMessageLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center p-4 border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button onClick={onClose} size={"iconSm"} variant={"ghost"}>
            <XIcon className="!size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex h-full items-center justify-center">
          <Loader className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-[49px] flex justify-between items-center p-4 border-b">
          <p className="text-lg font-bold">Thread</p>
          <Button onClick={onClose} size={"iconSm"} variant={"ghost"}>
            <XIcon className="!size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2 h-full items-center justify-center">
          <AlertTriangle className="size-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Message not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-[49px] flex justify-between items-center p-4 border-b">
        <p className="text-lg font-bold">Thread</p>
        <Button onClick={onClose} size={"iconSm"} variant={"ghost"}>
          <XIcon className="!size-5 stroke-[1.5]" />
        </Button>
      </div>
      <Message
        hideThreadButton
        memberId={message.memberId}
        authorImage={message.user.image}
        authorName={message.user.name}
        isAuthor={message.memberId === currentMember?._id}
        body={message.body}
        image={message.image}
        createdAt={message._creationTime}
        updatedAt={message.updatedAt}
        reactions={message.reactions}
        id={message._id}
        isEditing={editingId === message._id}
        setEditingId={setEditingId}
      />
    </div>
  );
};
