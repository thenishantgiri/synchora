import { v } from "convex/values";

import { auth } from "./auth";
import { mutation, query } from "./_generated/server";
import { normalizeChannelName } from "@/lib/utils";

export const remove = mutation({
  args: {
    id: v.id("channels"),
  },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const channel = await ctx.db.get(id);
    if (!channel) {
      throw new Error("Channel not found");
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", channel.workspaceId).eq("userId", userId)
      )
      .unique();

    if (!member || member.role !== "admin") {
      throw new Error("User not authorized");
    }

    // TODO: Remove associated messages

    await ctx.db.delete(id);

    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("channels"),
    name: v.string(),
  },
  handler: async (ctx, { id, name }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const channel = await ctx.db.get(id);
    if (!channel) {
      throw new Error("Channel not found");
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", channel.workspaceId).eq("userId", userId)
      )
      .unique();

    if (!member || member.role !== "admin") {
      throw new Error("User not authorized");
    }

    const parsedName = normalizeChannelName(name);

    if (parsedName.length < 3 || parsedName.length > 80) {
      throw new Error("Channel name must be between 3 and 80 characters");
    }

    const existing = await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", channel.workspaceId)
      )
      .filter((q) => q.eq(q.field("name"), parsedName))
      .unique();

    if (existing) {
      throw new Error(
        "A channel with this name already exists in this workspace"
      );
    }

    await ctx.db.patch(id, {
      name: parsedName,
    });

    return id;
  },
});

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

    const parsedName = normalizeChannelName(name);

    if (parsedName.length < 3 || parsedName.length > 80) {
      throw new Error("Channel name must be between 3 and 80 characters");
    }

    const existing = await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", workspaceId))
      .filter((q) => q.eq(q.field("name"), parsedName))
      .unique();

    if (existing) {
      throw new Error(
        "A channel with this name already exists in this workspace"
      );
    }

    const channelId = await ctx.db.insert("channels", {
      name: parsedName,
      workspaceId,
    });

    return channelId;
  },
});

export const getById = query({
  args: {
    id: v.id("channels"),
  },
  handler: async (ctx, { id }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const channel = await ctx.db.get(id);

    if (!channel) {
      return null;
    }

    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", channel.workspaceId).eq("userId", userId)
      )
      .unique();

    if (!member) {
      throw new Error("User is not a member of this workspace");
    }

    return channel;
  },
});

export const get = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { workspaceId }) => {
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

    if (!member) {
      throw new Error("User is not a member of this workspace");
    }

    const channels = await ctx.db
      .query("channels")
      .withIndex("by_workspace_id", (q) => q.eq("workspaceId", workspaceId))
      .collect();

    return channels;
  },
});
