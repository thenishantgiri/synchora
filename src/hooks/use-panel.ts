import { useParentMessageId } from "@/features/messages/store/use-parent-message-id";
import { Id } from "../../convex/_generated/dataModel";

export const usePanel = () => {
  const [parentMessageId, setParentMessageId] = useParentMessageId();

  const onOpenMessage = (messageId: Id<"messages">) => {
    setParentMessageId(messageId);
  };

  const onCloseMessage = () => {
    setParentMessageId(null);
  };

  return {
    parentMessageId,
    onOpenMessage,
    onCloseMessage,
  };
};
