import { v } from "convex/values";

import { auth } from "./auth";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { name, workspaceId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId)
      )
      .unique();

    if (!member || member.role !== "admin") {
      throw new Error("User not authorized");
    }

    const parsedName = name.replace(/\s+/g, "-").toLowerCase();

    if (parsedName.length < 3 || parsedName.length > 80) {
      throw new Error("Channel name must be between 3 and 80 characters");
    }

    const channelId = ctx.db.insert("channels", {
      name: parsedName,
      workspaceId,
    });

    return channelId;
  },
});

export const get = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { workspaceId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId)
      )
      .unique();

    if (!member) {
      return [];
    }

    const channels = await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    return channels;
  },
});
