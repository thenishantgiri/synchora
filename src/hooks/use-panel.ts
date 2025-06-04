import { useParentMessageId } from "@/features/messages/store/use-parent-message-id";
import { useProfileMemberId } from "@/features/members/store/use-profile-member-id";

import { Id } from "../../convex/_generated/dataModel";

export const usePanel = () => {
  const [parentMessageId, setParentMessageId] = useParentMessageId();
  const [profileMemberId, setProfileMemberId] = useProfileMemberId();

  const onOpenProfile = (memberId: Id<"members">) => {
    setProfileMemberId(memberId);
    setParentMessageId(null);
  };

  const onOpenMessage = (messageId: Id<"messages">) => {
    setParentMessageId(messageId);
    setProfileMemberId(null);
  };

  const onClose = () => {
    setParentMessageId(null);
    setProfileMemberId(null);
  };

  return {
    profileMemberId,
    parentMessageId,
    onOpenMessage,
    onOpenProfile,
    onClose,
  };
};
