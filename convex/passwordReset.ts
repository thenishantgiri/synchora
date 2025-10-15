import { Scrypt } from "lucia";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { sha256 as rawSha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";

const TOKEN_EXPIRATION_MS = 1000 * 60 * 30; // 30 minutes
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_PROVIDER = "password";

const encoder = new TextEncoder();
const randomBytes = (size: number) => {
  const array = new Uint8Array(size);
  crypto.getRandomValues(array);
  return array;
};

const hashToken = async (token: string) =>
  encodeHex(await rawSha256(encoder.encode(token)));

export const generateToken = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const normalizedEmail = email.trim().toLowerCase();

    let user =
      (await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", normalizedEmail))
        .unique()) ?? null;

    if (!user && normalizedEmail !== email.trim()) {
      user =
        (await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", email.trim()))
          .unique()) ?? null;
    }

    if (!user) {
      return { token: null, email: normalizedEmail, name: null };
    }

    const passwordAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", user!._id).eq("provider", PASSWORD_PROVIDER)
      )
      .unique();

    if (!passwordAccount) {
      return {
        token: null,
        email: user.email ?? normalizedEmail,
        name: user.name ?? null,
      };
    }

    const existingTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", user!._id))
      .collect();

    await Promise.all(existingTokens.map((tokenDoc) => ctx.db.delete(tokenDoc._id)));

    const token = encodeHex(randomBytes(32));
    const tokenHash = await hashToken(token);
    const expiresAt = Date.now() + TOKEN_EXPIRATION_MS;

    await ctx.db.insert("passwordResetTokens", {
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      token,
      email: user.email ?? normalizedEmail,
      name: user.name ?? null,
    };
  },
});

export const tokenStatus = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const tokenHash = await hashToken(token);

    const tokenRecord = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();

    if (!tokenRecord) {
      return { valid: false, reason: "invalid" } as const;
    }

    if (tokenRecord.usedAt) {
      return { valid: false, reason: "used" } as const;
    }

    if (tokenRecord.expiresAt < Date.now()) {
      return { valid: false, reason: "expired" } as const;
    }

    return { valid: true } as const;
  },
});

export const resetPassword = mutation({
  args: {
    token: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { token, password }) => {
    const nextPassword = password;

    if (nextPassword.length < PASSWORD_MIN_LENGTH) {
      throw new Error(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
      );
    }

    const tokenHash = await hashToken(token);

    const tokenRecord = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", tokenHash))
      .unique();

    if (!tokenRecord || tokenRecord.expiresAt < Date.now()) {
      throw new Error("Invalid or expired reset token");
    }

    if (tokenRecord.usedAt) {
      throw new Error("Reset token has already been used");
    }

    const user = await ctx.db.get(tokenRecord.userId);

    if (!user) {
      throw new Error("User not found");
    }

    const passwordAccount = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", user._id).eq("provider", PASSWORD_PROVIDER)
      )
      .unique();

    if (!passwordAccount) {
      throw new Error("Password authentication not available for this user");
    }

    const hashedSecret = await new Scrypt().hash(nextPassword);

    await ctx.db.patch(passwordAccount._id, {
      secret: hashedSecret,
    });

    // Mark token as used and cleanup any other pending tokens
    await ctx.db.patch(tokenRecord._id, { usedAt: Date.now() });

    const otherTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .collect();

    await Promise.all(
      otherTokens
        .filter((doc) => doc._id !== tokenRecord._id)
        .map((doc) => ctx.db.delete(doc._id))
    );

    // Invalidate active sessions & refresh tokens
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of sessions) {
      const refreshTokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();

      await Promise.all(
        refreshTokens.map((refreshToken) => ctx.db.delete(refreshToken._id))
      );

      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});
