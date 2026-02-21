/**
 * POST /api/webhooks/github
 *
 * Receives GitHub webhook events for all registered repos.
 * Immediately responds 200 OK, then processes the event asynchronously.
 *
 * Security: HMAC-SHA256 signature verified against the stored per-webhook secret.
 */

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/mongodb/db";
import { WebhookRegistration } from "@/mongodb/models/webhookRegistration";
import { User } from "@/mongodb/models/user";
import {
  verifyWebhookSignature,
  isMeaningfulChange,
  runRescrapeForUser,
} from "@/lib/githubWebhook";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Read raw body as text for signature verification
  const rawBody = await req.text();

  const event = req.headers.get("x-github-event") || "";
  const signatureHeader = req.headers.get("x-hub-signature-256") || "";
  const repoFullName =
    req.headers.get("x-github-repository") ||
    (() => {
      try {
        const payload = JSON.parse(rawBody);
        return payload?.repository?.full_name || "";
      } catch {
        return "";
      }
    })();

  if (!signatureHeader) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  await connectDB();

  // Find the webhook registration for this repo to get the per-webhook secret
  const [owner, repoName] = repoFullName.split("/");
  let registration: any = null;

  if (owner && repoName) {
    registration = await WebhookRegistration.findOne({
      repoOwner: owner,
      repoName,
      active: true,
    })
      .select("+secret")
      .lean();
  }

  // Fall back to global GITHUB_WEBHOOK_SECRET if no per-repo secret found
  const secret =
    registration?.secret || process.env.GITHUB_WEBHOOK_SECRET || "";

  if (!secret) {
    console.error("[webhook] No secret available for signature verification");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  if (!verifyWebhookSignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse payload
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // Handle GitHub ping (sent when webhook is first registered)
  if (event === "ping") {
    if (registration) {
      await WebhookRegistration.findByIdAndUpdate(registration._id, {
        lastTriggeredAt: new Date(),
      });
    }
    return NextResponse.json({ ok: true, message: "pong" });
  }

  // Check if this event warrants re-analysis
  if (!isMeaningfulChange(event, payload)) {
    return NextResponse.json({ ok: true, message: "Event skipped — not meaningful" });
  }

  // Look up the user by GitHub username (sender.login)
  const senderLogin =
    (payload.sender as any)?.login ||
    (payload.repository as any)?.owner?.login ||
    "";

  if (!senderLogin) {
    return NextResponse.json({ ok: true, message: "Could not identify sender" });
  }

  const dbUser = await User.findOne({ githubUsername: senderLogin }).lean() as any;
  if (!dbUser) {
    // Unknown user — not an error, just not registered on the platform
    return NextResponse.json({ ok: true, message: "User not found on platform" });
  }

  // Update webhook last-triggered timestamp
  if (registration) {
    await WebhookRegistration.findByIdAndUpdate(registration._id, {
      lastTriggeredAt: new Date(),
    });
  }

  // Immediately respond 200 — GitHub retries on non-200 responses
  // Fire-and-forget the heavy processing
  setImmediate(() => {
    runRescrapeForUser(dbUser.userId, "webhook").catch((err) => {
      console.error("[webhook] Background rescrape failed:", err);
    });
  });

  return NextResponse.json({
    ok: true,
    message: "Webhook received — processing in background",
  });
}
