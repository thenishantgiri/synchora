import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const joinCode = "123456"; // TODO: Generate a unique join code

    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name,
      userId,
      joinCode,
    });

    return workspaceId;
  },
});

export const get = query({
  args: {},
  handler: async ({ db }) => {
    return await db.query("workspaces").collect();
  },
});
