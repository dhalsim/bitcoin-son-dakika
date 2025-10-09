import { randomBytes } from "crypto";

import { createClient } from "@libsql/client";

import { ErrorResponseCreator, SuccessResponse } from "../api-helpers/common_with_client.js";

// Initialize Turso client
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

interface EmailSubscriptionRequest {
  email: string;
  daily: boolean;
  weekly: boolean;
}

function generateUnsubscribeToken(): string {
  return randomBytes(32).toString("hex");
}

// Vercel Edge Function handler for GET requests (for unsubscribe links)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return ErrorResponseCreator("Unsubscribe token gerekli", 400);
    }

    // Find subscription by token
    const subscription = await turso.execute({
      sql: "SELECT id, email, active FROM email_subscriptions WHERE unsubscribe_token = ?",
      args: [token],
    });

    if (subscription.rows.length === 0) {
      return ErrorResponseCreator("Geçersiz unsubscribe token", 404);
    }

    const subscriptionData = subscription.rows[0];

    // Check if already unsubscribed
    if (subscriptionData.active === 0) {
      return SuccessResponse({
        message: "Bu e-posta adresi zaten abonelikten çıkarılmış",
        email: subscriptionData.email,
        alreadyUnsubscribed: true,
      });
    }

    // Deactivate subscription
    const result = await turso.execute({
      sql: "UPDATE email_subscriptions SET active = 0, updated_at = ? WHERE unsubscribe_token = ?",
      args: [new Date().toISOString(), token],
    });

    if (result.rowsAffected === 0) {
      return ErrorResponseCreator("Abonelikten çıkma işlemi başarısız", 500);
    }

    return SuccessResponse({
      message: "Başarıyla abonelikten çıkarıldınız",
      email: subscriptionData.email,
      unsubscribed: true,
    });
  } catch (error) {
    console.error("Unsubscribe API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";

    return ErrorResponseCreator(errorMessage, 500);
  }
}

// Vercel Edge Function handler for POST requests
export async function POST(request: Request) {
  try {
    const body: EmailSubscriptionRequest = await request.json();
    const { email, daily, weekly } = body;

    // Validation
    if (!email || typeof email !== "string") {
      return ErrorResponseCreator("E-posta adresi gerekli", 400);
    }

    // Email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ErrorResponseCreator("Geçerli bir e-posta adresi giriniz", 400);
    }

    // Check if at least one frequency is selected
    if (!daily && !weekly) {
      return ErrorResponseCreator("En az bir bildirim sıklığı seçmelisiniz", 400);
    }

    // Check if email already exists
    const existingSubscription = await turso.execute({
      sql: "SELECT id FROM email_subscriptions WHERE email = ?",
      args: [email.toLowerCase()],
    });

    if (existingSubscription.rows.length > 0) {
      return ErrorResponseCreator("Bu e-posta adresi zaten abone", 409);
    }

    // Generate unique unsubscribe token
    const unsubscribeToken = generateUnsubscribeToken();

    // Insert new subscription
    const result = await turso.execute({
      sql: `
        INSERT INTO email_subscriptions (email, daily_notifications, weekly_notifications, unsubscribe_token, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        email.toLowerCase(),
        daily ? 1 : 0,
        weekly ? 1 : 0,
        unsubscribeToken,
        new Date().toISOString(),
        new Date().toISOString(),
      ],
    });

    if (result.rowsAffected === 0) {
      return ErrorResponseCreator("Abonelik oluşturulamadı", 500);
    }

    return SuccessResponse({
      message: "Başarıyla abone oldunuz",
      subscriptionId: result.lastInsertRowid?.toString(),
    });
  } catch (error) {
    console.error("Email subscription API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";

    return ErrorResponseCreator(errorMessage, 500);
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
