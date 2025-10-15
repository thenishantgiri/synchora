import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { alphabet, generateRandomString, sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";

const CODE_LENGTH = 6;
const CODE_EXPIRATION_MS = 1000 * 60 * 10; // 10 minutes
const MAX_ATTEMPTS = 5;

const encoder = new TextEncoder();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const hashCode = async (code: string) =>
  encodeHex(await sha256(encoder.encode(code)));

export const request = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    const existingToken = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existingToken) {
      await ctx.db.delete(existingToken._id);
    }

    const code = generateRandomString(CODE_LENGTH, alphabet("0-9"));
    const codeHash = await hashCode(code);

    await ctx.db.insert("emailVerificationTokens", {
      email: normalizedEmail,
      codeHash,
      expiresAt: Date.now() + CODE_EXPIRATION_MS,
      attempts: 0,
    });

    return {
      email: normalizedEmail,
      code,
      expiresAt: Date.now() + CODE_EXPIRATION_MS,
    };
  },
});

export const verify = mutation({
  args: {
    email: v.string(),
    code: v.string(),
  },
  handler: async (ctx, { email, code }) => {
    const normalizedEmail = normalizeEmail(email);

    const token = await ctx.db
      .query("emailVerificationTokens")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (!token) {
      throw new Error("No verification request found for this email.");
    }

    if (token.expiresAt < Date.now()) {
      await ctx.db.delete(token._id);
      throw new Error("Verification code has expired. Please request a new one.");
    }

    const attempts = (token.attempts ?? 0) + 1;
    if (attempts > MAX_ATTEMPTS) {
      await ctx.db.delete(token._id);
      throw new Error("Too many invalid attempts. Please request a new code.");
    }

    const codeHash = await hashCode(code);
    if (codeHash !== token.codeHash) {
      await ctx.db.patch(token._id, { attempts });
      throw new Error("Invalid verification code.");
    }

    await ctx.db.delete(token._id);

    return { success: true };
  },
});
