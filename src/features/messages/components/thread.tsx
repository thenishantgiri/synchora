import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Quill from "quill";
import { toast } from "sonner";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { AlertTriangle, Loader, XIcon } from "lucide-react";

import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useChannelId } from "@/hooks/use-channel-id";

import { Button } from "@/components/ui/button";
import { Message } from "@/components/message";

import { useCurrentMember } from "@/features/members/api/use-current-members";
import { useGetMessage } from "@/features/messages/api/use-get-message";
import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";
import { useGetMessages } from "@/features/messages/api/use-get-messages";

import { Id } from "../../../../convex/_generated/dataModel";

const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
});

const TIME_THRESHOLD = 5;

interface ThreadProps {
  messageId: Id<"messages">;
  onClose: () => void;
}

type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  parentMessageId: Id<"messages"> | undefined;
  body: string;
  image?: Id<"_storage"> | undefined;
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";

  return format(date, "EEEE, MMMM d");
};

export const Thread = ({ messageId, onClose }: ThreadProps) => {
  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();

  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const editorRef = useRef<Quill | null>(null);

  const { mutate: createMessage } = useCreateMessage();
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();

  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { data: message, isLoading: isMessageLoading } = useGetMessage({
    id: messageId,
  });
  const { results, status, loadMore } = useGetMessages({
    workspaceId,
    channelId,
    parentMessageId: messageId,
  });

  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    try {
      setIsPending(true);
      editorRef.current?.enable(false); // Disable the editor while submitting

      const values: CreateMessageValues = {
        channelId,
        workspaceId,
        parentMessageId: messageId,
        body,
        image: undefined,
      };

      if (image) {
        const uploadUrl = await generateUploadUrl({}, { throwError: true });

        if (!uploadUrl) {
          throw new Error("Failed to generate upload URL");
        }

        // Upload the image to the generated URL
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: image,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to upload image: ${response.status} ${response.statusText}`
          );
        }

        // Extract storage ID from the response
        const { storageId } = await response.json();
        values.image = storageId as Id<"_storage">;
      }

      await createMessage(values, { throwError: true });

      setEditorKey((prevKey) => prevKey + 1); // Reset the editor
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsPending(false);
      editorRef.current?.enable(true); // Re-enable the editor after submission
    }
  };

  const groupedMessages = results?.reduce(
    (groups, message) => {
      const date = new Date(message._creationTime);
      const dateKey = format(date, "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof results>
  );

  if (isMessageLoading || status === "LoadingFirstPage") {
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
      <div className="flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
        {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
          <div key={dateKey}>
            <div className="text-center my-2 relative">
              <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
              <span className="relative inline-block px-4 bg-white py-1 rounded-full text-xs border border-gray-300 shadow-sm">
                {formatDateLabel(dateKey)}
              </span>
            </div>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1];
              const isCompact =
                prevMessage &&
                prevMessage.user?._id === message.user?._id &&
                differenceInMinutes(
                  new Date(message._creationTime),
                  new Date(prevMessage._creationTime)
                ) < TIME_THRESHOLD;

              return (
                <Message
                  key={message._id}
                  id={message._id}
                  memberId={message.memberId}
                  authorImage={message.user.image}
                  authorName={message.user.name}
                  isAuthor={message.memberId === currentMember?._id}
                  reactions={message.reactions}
                  body={message.body}
                  image={message.image}
                  threadCount={message.threadCount}
                  threadImage={message.threadImage}
                  threadTimestamp={message.threadTimestamp}
                  isEditing={editingId === message._id}
                  setEditingId={setEditingId}
                  isCompact={isCompact}
                  hideThreadButton
                  updatedAt={message.updatedAt}
                  createdAt={message._creationTime}
                />
              );
            })}
          </div>
        ))}

        <div
          className="h-1"
          ref={(el) => {
            if (el) {
              const observer = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting && canLoadMore) {
                    loadMore();
                  }
                },
                { threshold: 1.0 }
              );

              observer.observe(el);
              return () => observer.disconnect();
            }
          }}
        />

        {isLoadingMore && (
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block px-4 bg-white py-1 rounded-full text-xs border border-gray-300 shadow-sm">
              <Loader className="!size-4 animate-spin" />
            </span>
          </div>
        )}

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
      <div className="px-4">
        <Editor
          key={editorKey}
          onSubmit={handleSubmit}
          innerRef={editorRef}
          disabled={isPending}
          placeholder="Reply to this thread..."
        />
      </div>
    </div>
  );
};
