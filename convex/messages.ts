import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

import { mutation, query, QueryCtx } from "./_generated/server";
import { auth } from "./auth";
import { Doc, Id } from "./_generated/dataModel";

const populateThread = async (ctx: QueryCtx, messageId: Id<"messages">) => {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_parent_message_id", (q) =>
      q.eq("parentMessageId", messageId)
    )
    .collect();

  if (messages.length === 0) {
    return {
      count: 0,
      image: undefined,
      timestamp: 0,
    };
  }

  const latestMessage = messages[messages.length - 1];
  const latestMessageMember = await populateMember(ctx, latestMessage.memberId);

  if (!latestMessageMember) {
    return {
      count: 0,
      image: undefined,
      timestamp: 0,
    };
  }

  const latestMessageUser = await populateUser(ctx, latestMessageMember.userId);

  return {
    count: messages.length,
    image: latestMessageUser?.image,
    timestamp: latestMessage._creationTime,
  };
};

const populateReactions = (ctx: QueryCtx, messageId: Id<"messages">) => {
  return ctx.db
    .query("reactions")
    .withIndex("by_message_id", (q) => q.eq("messageId", messageId))
    .collect();
};

const populateUser = (ctx: QueryCtx, userId: Id<"users">) => {
  return ctx.db.get(userId);
};

const populateMember = (ctx: QueryCtx, memberId: Id<"members">) => {
  return ctx.db.get(memberId);
};

const getMember = async (
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">
) => {
  return await ctx.db
    .query("members")
    .withIndex("by_workspace_id_user_id", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .unique();
};

const resolveConversationOrChannel = async (
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">,
  parentMessageId: Id<"messages">
): Promise<{
  conversationId?: Id<"conversations">;
  channelId?: Id<"channels">;
}> => {
  const parentMessage = await ctx.db.get(parentMessageId);
  if (!parentMessage) {
    throw new Error("Parent message not found");
  }

  if (parentMessage.workspaceId !== workspaceId) {
    throw new Error("Parent message does not belong to the same workspace");
  }

  return {
    conversationId: parentMessage.conversationId,
    channelId: parentMessage.conversationId
      ? undefined
      : parentMessage.channelId,
  };
};

// Helper function to process reactions efficiently
const processReactions = (reactions: Doc<"reactions">[]) => {
  const reactionMap = new Map<
    string,
    {
      value: string;
      count: number;
      memberIds: Set<Id<"members">>;
      messageId: Id<"messages">;
      _id: Id<"reactions">;
      _creationTime: number;
    }
  >();

  reactions.forEach((reaction) => {
    const existing = reactionMap.get(reaction.value);

    if (existing) {
      existing.memberIds.add(reaction.memberId);
      existing.count = existing.memberIds.size;
    } else {
      reactionMap.set(reaction.value, {
        ...reaction,
        count: 1,
        memberIds: new Set([reaction.memberId]),
      });
    }
  });

  return Array.from(reactionMap.values()).map(
    ({ memberIds, ...reaction }) => reaction
  );
};

export const get = query({
  args: {
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    parentMessageId: v.optional(v.id("messages")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const currentMember = await getMember(ctx, args.workspaceId, userId);
    if (!currentMember) {
      throw new Error("User is not a member of the workspace");
    }

    let _conversationId = args.conversationId;

    if (!args.conversationId && !args.channelId && args.parentMessageId) {
      const result = await resolveConversationOrChannel(
        ctx,
        args.workspaceId,
        args.parentMessageId
      );
      _conversationId = result.conversationId;
    }

    const results = await ctx.db
      .query("messages")
      .withIndex("by_channel_id_parent_message_id_conversation_id", (q) =>
        q
          .eq("channelId", args.channelId)
          .eq("parentMessageId", args.parentMessageId)
          .eq("conversationId", _conversationId)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    const populatedMessages = await Promise.all(
      results.page.map(async (message) => {
        const [messageMember, reactions, thread] = await Promise.all([
          populateMember(ctx, message.memberId),
          populateReactions(ctx, message._id),
          populateThread(ctx, message._id),
        ]);

        // Handle case where member is deleted - log and skip instead of returning null
        if (!messageMember) {
          console.warn(
            `Member ${message.memberId} not found for message ${message._id}`
          );
          return null;
        }

        const user = await populateUser(ctx, messageMember.userId);

        // Handle case where user is deleted
        if (!user) {
          console.warn(
            `User ${messageMember.userId} not found for member ${messageMember._id}`
          );
          return null;
        }

        const image = message.image
          ? await ctx.storage.getUrl(message.image)
          : undefined;

        const processedReactions = processReactions(reactions);

        return {
          ...message,
          image,
          member: messageMember,
          user,
          reactions: processedReactions,
          threadCount: thread.count,
          threadImage: thread.image,
          threadTimestamp: thread.timestamp,
        };
      })
    );

    // Filter out any null messages (deleted users/members) instead of keeping nulls
    const validMessages = populatedMessages.filter(
      (message) => message !== null
    );

    return {
      ...results,
      page: validMessages,
    };
  },
});

export const create = mutation({
  args: {
    body: v.string(),
    image: v.optional(v.id("_storage")),
    workspaceId: v.id("workspaces"),
    channelId: v.optional(v.id("channels")),
    parentMessageId: v.optional(v.id("messages")),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const member = await getMember(ctx, args.workspaceId, userId);

    if (!member) {
      throw new Error("User is not a member of the workspace");
    }

    // Resolve conversation or channel if replying in thread
    let resolvedConversationId = args.conversationId;
    let resolvedChannelId = args.channelId;

    if (!args.conversationId && !args.channelId && args.parentMessageId) {
      const result = await resolveConversationOrChannel(
        ctx,
        args.workspaceId,
        args.parentMessageId
      );
      resolvedConversationId = result.conversationId;
      resolvedChannelId = result.channelId;
    }

    const messageId = await ctx.db.insert("messages", {
      body: args.body,
      image: args.image,
      memberId: member._id,
      workspaceId: args.workspaceId,
      channelId: resolvedChannelId,
      conversationId: resolvedConversationId,
      parentMessageId: args.parentMessageId,
    });

    return messageId;
  },
});
